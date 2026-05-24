#!/usr/bin/env python3
"""
HermesAudit Tool: Solidity Contract Parser
Hermes Agent calls this to extract contract structure and flag suspicious patterns.
Run directly to test: python tools/solidity_parser.py contracts/sample.sol
"""
import re, sys, json
from pathlib import Path


def parse_contract(filepath: str) -> dict:
    """Parse a Solidity file and return structured audit data."""
    path = Path(filepath)
    if not path.exists():
        return {"error": f"File not found: {filepath}"}
    source = path.read_text()

    # Extract pragma version (e.g. ^0.8.0)
    pragma = re.findall(r'pragma solidity\s+([^;]+);', source)

    # Find all contract names
    contracts = re.findall(r'contract\s+(\w+)', source)

    # Extract all function signatures
    functions = re.findall(
        r'function\s+(\w+)\s*\(([^)]*)\)\s*(public|private|internal|external)?\s*(view|pure|payable)?',
        source
    )

    # Extract state variable declarations
    state_vars = re.findall(
        r'(address|uint256|uint|int|bool|string|bytes\d*)\s+(public|private)?\s*(\w+)',
        source
    )

    suspicious = []

    # Check 1: Reentrancy — .call before balance decrement
    if re.search(r'\.call\{value:', source):
        call_pos = source.find('.call{value:')
        after_call = source[call_pos:]
        if re.search(r'balances\[.*\]\s*-=', after_call):
            suspicious.append({
                "type": "REENTRANCY",
                "description": "ETH sent via .call before balance is decremented",
                "severity": "CRITICAL",
                "fix": "Move balance update BEFORE the external .call — use Checks-Effects-Interactions pattern"
            })

    # Check 2: Public drain/withdraw with no access control
    drain_funcs = re.findall(
        r'function\s+(\w*[Dd]rain\w*|emergency\w*)\s*\([^)]*\)\s*public',
        source
    )
    for func in drain_funcs:
        if not re.search(rf'function\s+{func}[^{{]*onlyOwner', source):
            suspicious.append({
                "type": "MISSING_ACCESS_CONTROL",
                "description": f"Function '{func}' is public with no owner check — anyone can call it",
                "severity": "HIGH",
                "fix": "Add: require(msg.sender == owner, 'Not owner'); or use OpenZeppelin Ownable"
            })

    # Check 3: tx.origin auth (phishing risk)
    if 'tx.origin' in source:
        suspicious.append({
            "type": "TX_ORIGIN_AUTH",
            "description": "tx.origin used for authorization — vulnerable to phishing attacks",
            "severity": "HIGH",
            "fix": "Replace tx.origin with msg.sender for authorization checks"
        })

    # Check 4: selfdestruct
    if 'selfdestruct' in source:
        suspicious.append({
            "type": "SELFDESTRUCT",
            "description": "Contract can be permanently destroyed",
            "severity": "MEDIUM",
            "fix": "Remove selfdestruct or add strict multi-sig authorization before allowing it"
        })

    # Check 5: timestamp dependence
    if 'block.timestamp' in source or 'now' in source:
        suspicious.append({
            "type": "TIMESTAMP_DEPENDENCE",
            "description": "block.timestamp used — miners can shift it by ~15 seconds",
            "severity": "LOW",
            "fix": "Avoid using block.timestamp for critical randomness or deadlines"
        })

    # Check 6: hardcoded addresses (potential backdoor)
    hardcoded = re.findall(r'0x[a-fA-F0-9]{40}', source)
    if hardcoded:
        suspicious.append({
            "type": "HARDCODED_ADDRESS",
            "description": f"Hardcoded addresses found: {hardcoded}",
            "severity": "MEDIUM",
            "fix": "Use constructor parameters or governance for address configuration"
        })

    return {
        "file": path.name,
        "pragma_version": pragma[0] if pragma else "unknown",
        "contracts_found": contracts,
        "total_functions": len(functions),
        "functions": [{"name": f[0], "visibility": f[2] or "unknown", "modifier": f[3] or "none"} for f in functions],
        "state_variables": len(state_vars),
        "pre_scan_flags": suspicious,
        "total_flags": len(suspicious)
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python tools/solidity_parser.py <path_to_contract.sol>")
        sys.exit(1)
    result = parse_contract(sys.argv[1])
    print(json.dumps(result, indent=2))
