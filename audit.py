#!/usr/bin/env python3
"""
HermesAudit — Main Runner
Usage: python audit.py contracts/sample.sol
"""

import sys, json, subprocess, os
from datetime import datetime
from pathlib import Path
import urllib.request
import urllib.error


# ─── CONFIG ───────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_KEY_HERE")
MODEL = "mistralai/mistral-7b-instruct:free"
REPORTS_DIR = Path("reports")
SKILLS_FILE = Path("skills/audit_skill.md")
SOUL_FILE = Path("SOUL.md")


def run_parser(contract_path: str) -> dict:
    """Run the solidity_parser tool and return parsed JSON."""
    print(f"[1/4] Parsing contract: {contract_path}")
    result = subprocess.run(
        [sys.executable, "tools/solidity_parser.py", contract_path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Parser error: {result.stderr}")
        sys.exit(1)
    return json.loads(result.stdout)


def load_file(path: Path) -> str:
    """Load a text file, return empty string if missing."""
    return path.read_text(encoding='utf-8') if path.exists() else ""


def build_prompt(contract_path: str, parsed: dict, source: str) -> str:
    """Build the full audit prompt for Hermes Agent."""
    skill = load_file(SKILLS_FILE)
    soul = load_file(SOUL_FILE)
    flags_str = json.dumps(parsed.get("pre_scan_flags", []), indent=2)
    funcs_str = json.dumps(parsed.get("functions", []), indent=2)

    return f"""
You are HermesAudit, a smart contract security auditor.
{soul}

=== AUDIT SKILL ===
{skill}

=== CONTRACT METADATA (from parser tool) ===
File         : {parsed['file']}
Pragma       : {parsed['pragma_version']}
Contracts    : {parsed['contracts_found']}
Functions    : {parsed['total_functions']}
Pre-scan flags found: {parsed['total_flags']}

=== PARSER PRE-SCAN FLAGS ===
{flags_str}

=== FUNCTION LIST ===
{funcs_str}

=== FULL CONTRACT SOURCE CODE ===
{source}

=== YOUR TASK ===
Follow the audit skill procedure exactly.
Find ALL vulnerabilities — the parser already caught some, but do a full deep review.
Output the complete HERMESAUDIT REPORT at the end.
"""


def call_hermes(prompt: str) -> str:
    """Send prompt to Hermes Agent via OpenRouter API."""
    print("[2/4] Sending to Hermes Agent for deep analysis...")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/hermesaudit",
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
            return resp_data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        print(f"Response: {e.read().decode('utf-8')}")
        raise
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        raise


def save_report(contract_path: str, report: str) -> Path:
    """Save the audit report to reports/ folder."""
    REPORTS_DIR.mkdir(exist_ok=True)
    contract_name = Path(contract_path).stem
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f"audit_{contract_name}_{timestamp}.txt"
    report_path.write_text(report)
    return report_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python audit.py <path_to_contract.sol>")
        print("Example: python audit.py contracts/sample.sol")
        sys.exit(1)

    contract_path = sys.argv[1]
    if not Path(contract_path).exists():
        print(f"Error: Contract file not found: {contract_path}")
        sys.exit(1)

    if OPENROUTER_API_KEY == "YOUR_KEY_HERE":
        print("Error: Set your OpenRouter API key!")
        print("Run: export OPENROUTER_API_KEY=sk-or-your-key-here")
        sys.exit(1)

    # Step 1: Parse
    parsed = run_parser(contract_path)
    print(f"   Found {parsed['total_flags']} pre-scan flags")

    # Step 2: Load source
    source = Path(contract_path).read_text(encoding='utf-8')

    # Step 3: Build prompt and call Hermes
    prompt = build_prompt(contract_path, parsed, source)
    report = call_hermes(prompt)

    # Step 4: Save and display
    print("[3/4] Generating report...")
    report_path = save_report(contract_path, report)
    print(f"[4/4] Done! Report saved to: {report_path}")
    print()
    print("=" * 60)
    print(report)
    print("=" * 60)


if __name__ == "__main__":
    main()
