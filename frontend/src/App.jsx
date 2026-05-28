import React, { useState, useEffect, useRef } from 'react';
import './App.css';

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

function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヲ ン 0 1'.split(' ');
    const columns = Math.ceil(window.innerWidth / 20);
    const drops = Array(columns).fill(0);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 255, 150, 0.12)';
      ctx.font = '14px Share Tech Mono';

      for (let i = 0; i < drops.length; i++) {
        const text = katakana[Math.floor(Math.random() * katakana.length)];
        ctx.fillText(text, i * 20, drops[i] * 14);
        if (drops[i] * 14 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
}

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">HERMESAUDIT</div>
      </div>
      <div className="navbar-right">
        <a href="https://github.com/Steve2009729/Hermes" target="_blank" rel="noopener noreferrer" className="nav-link">GitHub</a>
        <a href="https://dev.to" target="_blank" rel="noopener noreferrer" className="nav-link">DEV.to</a>
        <span className="challenge-badge">HERMES AGENT</span>
      </div>
    </nav>
  );
}

function Hero() {
  const [displayText, setDisplayText] = useState("");
  const fullText = "AUTONOMOUS SMART CONTRACT SECURITY AUDITOR";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="title-line-1">HERMES</span>
          <span className="title-line-2">AUDIT</span>
        </h1>
        <p className="hero-subtitle">{displayText}<span className="cursor">_</span></p>
        <p className="hero-description">
          Real-time vulnerability detection powered by AI reasoning
        </p>
        <div className="stats-container">
          <div className="stat-box">
            <div className="stat-number">6+</div>
            <div className="stat-label">VULN TYPES</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">AI</div>
            <div className="stat-label">POWERED</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">∞</div>
            <div className="stat-label">OPEN SOURCE</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Scanner() {
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

function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2>HOW IT WORKS</h2>
      <div className="steps-container">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-title">PASTE CONTRACT</div>
          <p>Drop your .sol code in the editor</p>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-title">HERMES ANALYZES</div>
          <p>AI agent runs multi-step reasoning</p>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-title">GET REPORT</div>
          <p>Full vulnerability breakdown</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <p>© 2026 HERMESAUDIT</p>
        <p>BUILT FOR DEV.TO HERMES AGENT CHALLENGE</p>
      </div>
      <div className="footer-right">
        <a href="https://github.com/Steve2009729/Hermes" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">OpenRouter</a>
        <a href="https://nous.ai" target="_blank" rel="noopener noreferrer">Nous Research</a>
      </div>
      <div className="system-tag">SYS::HERMES_AGENT_v1.0</div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="app">
      <MatrixBackground />
      <div className="scanlines"></div>
      <Navbar />
      <Hero />
      <Scanner />
      <HowItWorks />
      <Footer />
    </div>
  );
}
