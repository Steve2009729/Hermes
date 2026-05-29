import re
from typing import Dict, List, Any


def parse_contract(source_code: str) -> Dict[str, Any]:
    """Parse a Solidity contract and extract vulnerability flags."""
    if not source_code or not isinstance(source_code, str):
        return {
            "pragma_version": "unknown",
            "contracts_found": [],
            "functions": [],
            "state_variables": 0,
            "pre_scan_flags": [],
            "total_flags": 0
        }

    # Extract pragma version
    pragma = re.findall(r'pragma solidity\s+([^;]+);', source_code)

    # Find all contract names
    contracts = re.findall(r'contract\s+(\w+)', source_code)

    # Extract all function signatures
    functions = re.findall(
        r'function\s+(\w+)\s*\(([^)]*)\)\s*(public|private|internal|external)?\s*(view|pure|payable)?',
        source_code
    )

    # Extract state variable declarations
    state_vars = re.findall(
        r'(address|uint256|uint|int|bool|string|bytes\d*)\s+(public|private)?\s*(\w+)',
        source_code
    )

    suspicious = []

    # Check 1: Reentrancy — .call before balance decrement
    if re.search(r'\.call\{value:', source_code):
        call_pos = source_code.find('.call{value:')
        after_call = source_code[call_pos:]
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
        source_code
    )
    for func in drain_funcs:
        if not re.search(rf'function\s+{func}[^{{]*onlyOwner', source_code):
            suspicious.append({
                "type": "MISSING_ACCESS_CONTROL",
                "description": f"Function '{func}' is public with no owner check — anyone can call it",
                "severity": "HIGH",
                "fix": "Add: require(msg.sender == owner, 'Not owner'); or use OpenZeppelin Ownable"
            })

    # Check 3: tx.origin auth (phishing risk)
    if 'tx.origin' in source_code:
        suspicious.append({
            "type": "TX_ORIGIN_AUTH",
            "description": "tx.origin used for authorization — vulnerable to phishing attacks",
            "severity": "HIGH",
            "fix": "Replace tx.origin with msg.sender for authorization checks"
        })

    # Check 4: selfdestruct
    if 'selfdestruct' in source_code:
        suspicious.append({
            "type": "SELFDESTRUCT",
            "description": "Contract can be permanently destroyed",
            "severity": "MEDIUM",
            "fix": "Remove selfdestruct or add strict multi-sig authorization before allowing it"
        })

    # Check 5: timestamp dependence
    if 'block.timestamp' in source_code or 'now' in source_code:
        suspicious.append({
            "type": "TIMESTAMP_DEPENDENCE",
            "description": "block.timestamp used — miners can shift it by ~15 seconds",
            "severity": "LOW",
            "fix": "Avoid using block.timestamp for critical randomness or deadlines"
        })

    # Check 6: hardcoded addresses (potential backdoor)
    hardcoded = re.findall(r'0x[a-fA-F0-9]{40}', source_code)
    if hardcoded:
        suspicious.append({
            "type": "HARDCODED_ADDRESS",
            "description": f"Hardcoded addresses found: {hardcoded}",
            "severity": "MEDIUM",
            "fix": "Use constructor parameters or governance for address configuration"
        })

    return {
        "pragma_version": pragma[0] if pragma else "unknown",
        "contracts_found": contracts,
        "functions": [{"name": f[0], "visibility": f[2] or "unknown", "modifier": f[3] or "none"} for f in functions],
        "total_functions": len(functions),
        "state_variables": len(state_vars),
        "pre_scan_flags": suspicious,
        "total_flags": len(suspicious)
    }
