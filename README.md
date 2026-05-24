# HermesAudit — Smart Contract Scanner Powered by Hermes Agent

## What Is This?
HermesAudit uses Hermes Agent's autonomous planning and tool-use system to scan
Solidity smart contracts for security vulnerabilities — automatically.

Give it a .sol file. It finds reentrancy attacks, missing access controls,
tx.origin abuse, and more. Then it generates a full audit report.

## How It Works
1. solidity_parser.py (custom Hermes tool) extracts contract structure
2. audit_skill.md teaches Hermes the exact audit procedure
3. SOUL.md makes Hermes think like a strict security auditor
4. audit.py orchestrates everything and calls Hermes via OpenRouter
5. The full audit report is saved to reports/

## Quick Start
```bash
# 1. Install Hermes Agent
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 2. Set API key
export OPENROUTER_API_KEY=your-key-here

# 3. Run audit
python audit.py contracts/sample.sol
```

## Sample Output
[Paste your actual report output here after running it]

## Built With
- Hermes Agent by Nous Research
- OpenRouter (mistral-7b-instruct:free)
- Python 3.11
- Solidity

## Challenge
Built for the Hermes Agent Challenge on DEV.to
Tags: #hermesagentchallenge #devchallenge #agents #web3 #security
