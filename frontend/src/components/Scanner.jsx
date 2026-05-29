import React, { useState, useEffect } from 'react';

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // BUG 1: REENTRANCY
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }

    // BUG 2: MISSING ACCESS CONTROL
    function emergencyDrain() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    // BUG 3: LOGIC ERROR
    function batchDeposit(uint256 count) public payable {
        for (uint256 i = 0; i < count; i++) {
            balances[msg.sender] += msg.value;
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Scanner({ onResults }) {
  const [sourceCode, setSourceCode] = useState(SAMPLE_CONTRACT);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);

  const phases = [
    "INITIALIZING HERMES AGENT...",
    "PARSING CONTRACT STRUCTURE...",
    "RUNNING VULNERABILITY SCAN...",
    "GENERATING AUDIT REPORT..."
  ];

  useEffect(() => {
    if (!isLoading) return;

    let phaseIndex = 0;
    const phaseTimer = setInterval(() => {
      setCurrentPhase(phaseIndex % phases.length);
      phaseIndex++;
    }, 800);

    return () => clearInterval(phaseTimer);
  }, [isLoading]);

  const handleAudit = async () => {
    if (!sourceCode.trim()) {
      setError("Please paste a contract to audit");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPhase(0);

    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: sourceCode })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
      onResults && onResults(data);
    } catch (err) {
      setError(`Audit failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "CRITICAL": return "#ff0055";
      case "HIGH": return "#ff6b35";
      case "MODERATE": return "#ffa500";
      case "LOW": return "#00ff88";
      case "SAFE": return "#00ff88";
      default: return "#888";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL": return "#ff0055";
      case "HIGH": return "#ff6b35";
      case "MEDIUM": return "#ffa500";
      case "LOW": return "#ffff00";
      default: return "#888";
    }
  };

  const getRiskPercentage = (risk) => {
    switch (risk) {
      case "SAFE": return 0;
      case "LOW": return 25;
      case "MODERATE": return 50;
      case "HIGH": return 75;
      case "CRITICAL": return 100;
      default: return 50;
    }
  };

  return (
    <section className="scanner">
      <div className="scanner-columns">
        {/* LEFT COLUMN */}
        <div className="scanner-column input-column">
          <div className="panel-header">
            <div className="panel-indicator">●</div>
            <span>CONTRACT_INPUT.SOL</span>
          </div>
          <textarea
            className="contract-input"
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Paste your Solidity contract here..."
          />
          <button
            className="audit-button"
            onClick={handleAudit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                SCANNING...
              </>
            ) : (
              "▶ INITIALIZE AUDIT SEQUENCE"
            )}
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div className="scanner-column output-column">
          <div className="panel-header">
            <div className={`panel-indicator ${results ? 'active' : ''}`}>●</div>
            <span>AUDIT_RESULTS.JSON</span>
          </div>

          <div className="results-container">
            {!isLoading && !results && !error && (
              <div className="empty-state">
                <div className="empty-icon">⚡</div>
                <p>AWAITING CONTRACT INPUT</p>
              </div>
            )}

            {isLoading && (
              <div className="loading-state">
                <div className="loading-ring"></div>
                <p className="phase-text">{phases[currentPhase]}</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <div className="error-title">ERROR</div>
                <p>{error}</p>
              </div>
            )}

            {results && !isLoading && (
              <div className="results-content">
                <div className="risk-section">
                  <div className="risk-label">OVERALL RISK</div>
                  <div className="risk-meter">
                    <div
                      className="risk-bar"
                      style={{
                        width: `${getRiskPercentage(results.overall_risk)}%`,
                        backgroundColor: getRiskColor(results.overall_risk)
                      }}
                    />
                  </div>
                  <div className="risk-value" style={{ color: getRiskColor(results.overall_risk) }}>
                    {results.overall_risk}
                  </div>
                </div>

                <div className="counts-row">
                  <div className="count-box critical">
                    <div className="count-number">{results.findings.filter(f => f.severity === "CRITICAL").length}</div>
                    <div className="count-label">CRITICAL</div>
                  </div>
                  <div className="count-box high">
                    <div className="count-number">{results.findings.filter(f => f.severity === "HIGH").length}</div>
                    <div className="count-label">HIGH</div>
                  </div>
                  <div className="count-box medium">
                    <div className="count-number">{results.findings.filter(f => f.severity === "MEDIUM").length}</div>
                    <div className="count-label">MEDIUM</div>
                  </div>
                  <div className="count-box low">
                    <div className="count-number">{results.findings.filter(f => f.severity === "LOW").length}</div>
                    <div className="count-label">LOW</div>
                  </div>
                </div>

                <div className="findings-list">
                  {results.findings.map((finding, idx) => (
                    <div key={idx} className="finding-card">
                      <div className="finding-header">
                        <span className="finding-number">#{idx + 1}</span>
                        <span
                          className="severity-badge"
                          style={{ borderColor: getSeverityColor(finding.severity) }}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <div className="finding-type">{finding.type}</div>
                      <p className="finding-description">{finding.description}</p>
                      <div className="fix-box">
                        <span className="fix-label">▶ FIX</span>
                        <p className="fix-text">{finding.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
