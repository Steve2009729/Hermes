import os
import json
import re
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import urllib.request
import urllib.error
from dotenv import load_dotenv
import asyncio

from parser import parse_contract
from database import init_db, create_user, get_user_by_email
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
)

# Load environment variables
load_dotenv()

app = FastAPI(title="HermesAudit Backend", version="1.0.0")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "mistralai/mistral-7b-instruct:free"


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuditRequest(BaseModel):
    source_code: str


class ChatRequest(BaseModel):
    message: str
    history: list = []


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    
    token = authorization[7:]
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return email


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    await init_db()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "online", "service": "HermesAudit"}


@app.post("/auth/signup")
async def signup(request: SignupRequest):
    """Create a new user account"""
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", request.email):
        return {"error": "Invalid email format"}
    
    if len(request.password) < 8:
        return {"error": "Password must be at least 8 characters"}
    
    hashed_password = hash_password(request.password)
    result = await create_user(request.email, hashed_password)
    
    if "error" in result:
        return {"error": "Email already registered"}
    
    token = create_access_token({"sub": request.email})
    return {"message": "Account created", "token": token}


@app.post("/auth/login")
async def login(request: LoginRequest):
    """Authenticate a user and return JWT token"""
    user = await get_user_by_email(request.email)
    
    if not user or not verify_password(request.password, user["hashed_password"]):
        return {"error": "Invalid email or password"}
    
    token = create_access_token({"sub": user["email"]})
    return {"message": "Login successful", "token": token}


@app.get("/auth/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current user information"""
    user = await get_user_by_email(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email": user["email"],
        "joined": user["created_at"]
    }



@app.post("/audit")
async def audit(request: AuditRequest):
    """Main audit endpoint"""
    if not OPENROUTER_API_KEY:
        return {
            "contract_name": "Unknown",
            "overall_risk": "ERROR",
            "findings": [],
            "total_issues": 0,
            "summary": "API key not configured"
        }

    try:
        # Step 1: Parse contract
        parsed = parse_contract(request.source_code)

        # Step 2: Build audit prompt
        skill_description = """You are HermesAudit, an elite smart contract security auditor.
Analyze the provided Solidity contract and identify ALL vulnerabilities.

Check for:
1. Reentrancy patterns
2. Access control gaps
3. tx.origin usage
4. Integer overflow/underflow logic
5. Selfdestruct exposure
6. Timestamp dependence
7. Unchecked external calls
8. Hardcoded addresses or keys

Pre-scan flags already detected:
""" + json.dumps(parsed["pre_scan_flags"], indent=2) + """

Contract metadata:
- Pragma: """ + parsed["pragma_version"] + """
- Contracts: """ + str(parsed["contracts_found"]) + """
- Functions: """ + str(parsed["total_functions"] if "total_functions" in parsed else len(parsed["functions"])) + """

IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:
{
  "contract_name": "string",
  "overall_risk": "SAFE|LOW|MODERATE|HIGH|CRITICAL",
  "findings": [
    {
      "type": "VULNERABILITY_TYPE",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "description": "detailed description",
      "fix": "how to fix it"
    }
  ],
  "summary": "brief summary"
}"""

        prompt = f"""{skill_description}

CONTRACT SOURCE:
{request.source_code}"""

        # Step 3: Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Steve2009729/Hermes",
            "X-Title": "HermesAudit"
        }

        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2000,
            "temperature": 0.1
        }

        json_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json_data,
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                resp_data = json.loads(response.read().decode('utf-8'))
                response_text = resp_data["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            return {
                "contract_name": "Unknown",
                "overall_risk": "ERROR",
                "findings": [],
                "total_issues": 0,
                "summary": f"API error: {e.code} {e.reason}"
            }
        except urllib.error.URLError as e:
            return {
                "contract_name": "Unknown",
                "overall_risk": "ERROR",
                "findings": [],
                "total_issues": 0,
                "summary": f"Connection error: {str(e.reason)}"
            }

        # Step 4: Parse JSON response
        try:
            # Try to extract JSON from response
            json_str = response_text
            # If response contains markdown code blocks, extract the JSON
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            result = json.loads(json_str)

            # Validate required fields
            if "contract_name" not in result:
                result["contract_name"] = parsed["contracts_found"][0] if parsed["contracts_found"] else "Unknown"
            if "overall_risk" not in result:
                result["overall_risk"] = "MODERATE"
            if "findings" not in result:
                result["findings"] = []
            if "summary" not in result:
                result["summary"] = f"Found {len(result.get('findings', []))} vulnerabilities"

            result["total_issues"] = len(result.get("findings", []))
            return result

        except json.JSONDecodeError:
            # If JSON parsing fails, return fallback
            return {
                "contract_name": parsed["contracts_found"][0] if parsed["contracts_found"] else "Unknown",
                "overall_risk": "MODERATE",
                "findings": parsed["pre_scan_flags"],
                "total_issues": len(parsed["pre_scan_flags"]),
                "summary": "Using pre-scan analysis only (AI response parsing failed)"
            }

    except Exception as e:
        return {
            "contract_name": "Unknown",
            "overall_risk": "ERROR",
            "findings": [],
            "total_issues": 0,
            "summary": f"Error: {str(e)}"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
