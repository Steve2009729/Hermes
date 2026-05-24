# Skill: Smart Contract Security Audit

## Trigger
Use this skill whenever asked to audit, scan, review, or analyze a Solidity smart contract.

## Procedure

### Phase 1: Parse the Contract
1. Call the solidity_parser tool: `python tools/solidity_parser.py <filepath>`
2. Read the JSON output carefully
3. Note all pre_scan_flags — these are confirmed suspicious patterns
4. Count functions and identify which are public

### Phase 2: Deep Code Review
5. Read the raw Solidity source file
6. For each function, ask: who can call this? what does it touch? can it be abused?
7. Check the order of operations in any function that sends ETH
8. Check every public function for missing require() guards

### Phase 3: Classify Every Finding
9. For each issue found, assign:
   - Severity: CRITICAL / HIGH / MEDIUM / LOW
   - Location: function name and line description
   - Impact: what an attacker can do if they exploit this
   - Fix: the exact code change needed

### Phase 4: Generate Audit Report
10. Write the full report using this exact format:

═══════════════════════════════════════
  HERMESAUDIT REPORT
  Contract: [name]
  Date: [today]
═══════════════════════════════════════

SUMMARY
  Total Issues: X
  Critical: X  |  High: X  |  Medium: X  |  Low: X
  Overall Risk: [SAFE / LOW / MODERATE / HIGH / CRITICAL]

FINDINGS
[For each finding:]
  [#] SEVERITY — Title
  Location : function_name()
  Impact   : what happens if exploited
  Fix      : exact code fix

RECOMMENDATIONS
  [Top 3 priority actions before deployment]

## Notes
- Never skip a finding because it seems minor — log everything
- If unsure about severity, go one level higher to be safe
- Always finish with the RECOMMENDATIONS section
