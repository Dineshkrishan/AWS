# MERN App — AWS CI/CD Pipeline 🚀

A production-ready **MERN** (MongoDB, Express, React, Node.js) application containerized with **Docker** and deployed to **AWS** using a fully automated CI/CD pipeline.

---

## Architecture

```
Developer → GitHub → AWS CodePipeline
                           ↓
                     AWS CodeBuild
                     (npm test · docker build)
                           ↓
                     Amazon ECR
                     (Docker image registry)
                           ↓
                     Amazon ECS (Fargate)
                     (serverless containers)
                           ↓
                     Application Load Balancer
                           ↓
                     http://YOUR-ALB-DNS
```

---

## Project Structure

```
mern-app/
├── client/                   ← React 18 frontend
│   ├── public/index.html
│   └── src/
│       ├── App.js            ← Dashboard UI
│       ├── App.css           ← Glassmorphism dark theme
│       └── index.js
├── server/
│   ├── index.js              ← Express REST API
│   └── package.json
├── Dockerfile                ← Multi-stage build
├── .dockerignore
├── buildspec.yml             ← AWS CodeBuild spec
├── appspec.yml               ← ECS deploy spec
├── taskdef.json              ← ECS Task Definition
├── .env.example
└── .gitignore
```

---

## Local Development

### Prerequisites
- Node.js ≥ 18
- Docker Desktop

### 1. Backend only

```bash
cd server
npm install
cp ../.env.example .env     # copy env template
node index.js
# → http://localhost:5000/api
# → http://localhost:5000/health
```

### 2. Frontend only (dev server with proxy)

```bash
cd client
npm install
npm start
# → http://localhost:3000  (proxies /api → localhost:5000)
```

### 3. Full Docker build (production)

```bash
docker build -t mern-app .
docker run -p 5000:5000 -e NODE_ENV=production mern-app
# → http://localhost:5000
```

---

## AWS Setup (One-Time Manual Steps)

### Step 1 — Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name mern-app-repo \
  --region us-east-1
```

Note the **ECR URI** from the output:
`123456789012.dkr.ecr.us-east-1.amazonaws.com/mern-app-repo`

### Step 2 — Update Placeholder Values

Replace these in `taskdef.json` and `buildspec.yml`:

| Placeholder | Example Value |
|---|---|
| `<AWS_ACCOUNT_ID>` | `123456789012` |
| `<AWS_REGION>` | `us-east-1` |

### Step 3 — Create ECS Cluster (Fargate)

```bash
aws ecs create-cluster \
  --cluster-name mern-app-cluster \
  --capacity-providers FARGATE
```

### Step 4 — Create IAM Roles

Create two roles:
- `ecsTaskExecutionRole` — with `AmazonECSTaskExecutionRolePolicy`
- `ecsTaskRole` — with ECR read permissions

### Step 5 — Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/mern-app
```

### Step 6 — Register Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://taskdef.json
```

### Step 7 — Create ECS Service

```bash
aws ecs create-service \
  --cluster mern-app-cluster \
  --service-name mern-app-service \
  --task-definition mern-app-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Step 8 — Create CodePipeline

In the AWS Console:

| Stage | Provider | Config |
|---|---|---|
| **Source** | GitHub (v2) | Your repo, `main` branch |
| **Build** | AWS CodeBuild | New project using `buildspec.yml` |
| **Deploy** | Amazon ECS | Cluster: `mern-app-cluster`, Service: `mern-app-service` |

**CodeBuild environment variables to set:**

| Variable | Value |
|---|---|
| `AWS_DEFAULT_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | your account ID |
| `IMAGE_REPO_NAME` | `mern-app-repo` |
| `IMAGE_TAG` | `latest` |

### Step 9 — Access Your App

After the pipeline runs successfully:

```
http://YOUR-ALB-DNS-NAME
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api` | Main API response with server info |
| `GET` | `/api/pipeline` | CI/CD pipeline stage data |
| `GET` | `/health` | ECS health check endpoint |

---

## CI/CD Flow

```
git push origin main
      ↓
CodePipeline triggered automatically
      ↓
CodeBuild:
  1. npm install (smoke test)
  2. docker build -t mern-app .
  3. docker tag → ECR URI
  4. docker push → ECR
  5. write imagedefinitions.json
      ↓
ECS Deploy:
  - Pulls new image from ECR
  - Rolls out new task revision
  - Zero-downtime update
      ↓
App Live at ALB DNS 🎉
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Backend | Node.js 18 + Express 4 |
| Container | Docker (multi-stage, node:18-alpine) |
| Registry | Amazon ECR |
| Orchestration | Amazon ECS Fargate |
| CI/CD | AWS CodePipeline + CodeBuild |
| Logging | Amazon CloudWatch Logs |
| Source Control | GitHub |
