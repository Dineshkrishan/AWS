const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check (used by ECS health probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Main API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Hello from AWS CI/CD Pipeline! 🚀',
    pipeline: {
      source: 'GitHub',
      build: 'AWS CodeBuild',
      registry: 'Amazon ECR',
      deploy: 'Amazon ECS (Fargate)',
    },
    server: {
      runtime: 'Node.js + Express',
      version: process.version,
      uptime: `${Math.floor(process.uptime())}s`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Pipeline status endpoint
app.get('/api/pipeline', (req, res) => {
  res.json({
    stages: [
      { name: 'Source',  service: 'GitHub',          status: 'success', icon: '📦' },
      { name: 'Build',   service: 'AWS CodeBuild',   status: 'success', icon: '🔨' },
      { name: 'Image',   service: 'Amazon ECR',      status: 'success', icon: '🐳' },
      { name: 'Deploy',  service: 'Amazon ECS',      status: 'success', icon: '☁️'  },
      { name: 'Live',    service: 'Load Balancer',   status: 'success', icon: '🌐' },
    ],
  });
});

// ─── Serve React Static Build (Production) ────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Catch-all: serve React for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api`);
  console.log(`❤️   Health: http://localhost:${PORT}/health`);
});
