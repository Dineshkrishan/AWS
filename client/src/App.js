import { useEffect, useState } from 'react';
import './App.css';

// ─── Pipeline Stage Card ──────────────────────────────────────────────────────
function StageCard({ icon, name, service, status, delay }) {
  return (
    <div className="stage-card" style={{ animationDelay: `${delay}s` }}>
      <div className="stage-icon">{icon}</div>
      <div className="stage-info">
        <span className="stage-name">{name}</span>
        <span className="stage-service">{service}</span>
      </div>
      <div className={`stage-badge ${status}`}>{status}</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [apiData, setApiData]       = useState(null);
  const [pipeline, setPipeline]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apiRes, pipelineRes] = await Promise.all([
        fetch('/api'),
        fetch('/api/pipeline'),
      ]);
      const api      = await apiRes.json();
      const pipeline = await pipelineRes.json();
      setApiData(api);
      setPipeline(pipeline.stages || []);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError('Unable to reach backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      {/* ── Animated Background ── */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <div>
              <h1 className="logo-title">MERN + AWS CI/CD</h1>
              <p className="logo-sub">Automated Deployment Pipeline</p>
            </div>
          </div>
          <div className="header-right">
            {lastUpdated && (
              <span className="last-updated">Last synced: {lastUpdated}</span>
            )}
            <button className="refresh-btn" onClick={fetchData} disabled={loading}>
              {loading ? '⟳' : '↻'} Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Hero Message ── */}
        <section className="hero">
          {loading ? (
            <div className="skeleton-hero" />
          ) : error ? (
            <div className="error-card">⚠️ {error}</div>
          ) : (
            <div className="hero-message">
              <span className="hero-badge">LIVE</span>
              <h2 className="hero-text">{apiData?.message}</h2>
              <p className="hero-sub">
                Container running on <strong>AWS ECS Fargate</strong> · Image stored in <strong>Amazon ECR</strong>
              </p>
            </div>
          )}
        </section>

        {/* ── Stats Row ── */}
        {apiData && (
          <section className="stats-row">
            <StatCard label="Runtime"     value={apiData.server?.runtime?.split(' ')[0]}   icon="⚡" />
            <StatCard label="Node Version" value={apiData.server?.version}                  icon="🟢" />
            <StatCard label="Uptime"       value={apiData.server?.uptime}                   icon="⏱️" />
            <StatCard label="Environment"  value={apiData.environment || 'production'}       icon="🌍" />
          </section>
        )}

        {/* ── CI/CD Pipeline Flow ── */}
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">CI/CD Pipeline Stages</h3>
            <span className="section-badge">AWS CodePipeline</span>
          </div>
          <div className="pipeline-flow">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))
              : pipeline.map((stage, i) => (
                  <StageCard key={stage.name} {...stage} delay={i * 0.1} />
                ))}
          </div>
        </section>

        {/* ── Architecture Overview ── */}
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">Architecture Overview</h3>
            <span className="section-badge">AWS Services</span>
          </div>
          <div className="arch-grid">
            {[
              { icon: '🧑‍💻', name: 'Developer',       desc: 'Push code to GitHub'              },
              { icon: '🔗', name: 'GitHub',            desc: 'Source control trigger'            },
              { icon: '🔨', name: 'CodeBuild',         desc: 'Build, test & Docker image'        },
              { icon: '🐳', name: 'Amazon ECR',        desc: 'Docker image registry'             },
              { icon: '☁️',  name: 'ECS Fargate',      desc: 'Serverless container runtime'      },
              { icon: '🌐', name: 'Load Balancer',     desc: 'Public traffic routing'            },
            ].map((item, i) => (
              <div key={item.name} className="arch-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="arch-icon">{item.icon}</div>
                <strong>{item.name}</strong>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stack Cards ── */}
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">Tech Stack</h3>
            <span className="section-badge">MERN</span>
          </div>
          <div className="stack-grid">
            {[
              { layer: 'Frontend', tech: 'React',           color: '#61dafb', desc: 'SPA served as static build'      },
              { layer: 'Backend',  tech: 'Node.js + Express', color: '#68d391', desc: 'REST API on port 5000'          },
              { layer: 'Database', tech: 'MongoDB',          color: '#4db33d', desc: 'Atlas connection via env var'    },
              { layer: 'Container', tech: 'Docker',          color: '#2496ed', desc: 'Multi-stage production image'   },
            ].map(item => (
              <div key={item.layer} className="stack-card">
                <div className="stack-dot" style={{ background: item.color }} />
                <div>
                  <div className="stack-layer">{item.layer}</div>
                  <div className="stack-tech" style={{ color: item.color }}>{item.tech}</div>
                  <div className="stack-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>Built with ❤️ · MERN Stack · AWS CI/CD · Docker · ECS Fargate</p>
      </footer>
    </div>
  );
}

export default App;
