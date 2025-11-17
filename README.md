# Todolist Fullstack App

A production-oriented full-stack todo application built to explore real-world architecture, secure authentication, AWS infrastructure, and clean TypeScript monorepo design.

## 🚀 Overview

This project began as a simple MERN todo list while learning TypeScript a few years ago.
Over time, it grew into a production-ready, secure, and scalable application used to explore:

- Modern backend engineering practices
- Real custom authentication (beyond tutorials)
- Cloud infrastructure with AWS, Kubernetes, and Terraform
- Clean monorepo architecture & shared package design

This is no longer "just a todo app", it became a playground for building real-world, production-grade software.

## 🚀 Get Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 9.12.1+ (or install via `npm install -g pnpm@9.12.1`)
- **Docker** and **Docker Compose** (for local MongoDB)

> **Note**: For production, MongoDB Atlas is used. For local development, MongoDB runs via Docker Compose.

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd todolist-public
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory (or copy from `env.example`):

   ```bash
   cp env.example .env
   ```

   For local development, the default MongoDB connection string works with Docker Compose. Update JWT secrets:

   ```env
   # Local MongoDB (default - works with Docker Compose)
   DATABASE=mongodb://admin:password123@localhost:27017/todolist?authSource=admin

   # JWT secrets (generate strong random strings, minimum 32 characters)
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   REFRESH_HASH_SECRET=your-super-secret-refresh-hash-key-minimum-32-characters-long
   ```

### Running the Application

#### **Standard Local Development (Recommended)**

Start MongoDB via Docker Compose and run both backend and frontend:

```bash
pnpm dev:with-infra
```

This command:

- Starts MongoDB in Docker
- Starts Backend API at `http://localhost:3000`
- Starts Frontend at `http://localhost:5173`
- API docs available at `http://localhost:3000/api-docs`

#### **Run Services Separately**

If you need more control, start infrastructure and services separately:

```bash
# Start MongoDB in Docker
pnpm dev:infra

# In another terminal, start backend and frontend
pnpm dev
```

Or run services individually:

```bash
# Backend only
pnpm dev:api

# Frontend only
pnpm dev:web
```

#### **Stop Infrastructure**

When you're done, stop the MongoDB container:

```bash
pnpm dev:infra:down
```

### Common Commands

#### **Development**

```bash
# Standard local development (MongoDB + Backend + Frontend)
pnpm dev:with-infra

# Start MongoDB infrastructure only
pnpm dev:infra

# Stop MongoDB infrastructure
pnpm dev:infra:down

# Run backend and frontend (requires MongoDB running)
pnpm dev

# Run backend only
pnpm dev:api

# Run frontend only
pnpm dev:web
```

#### **Building**

```bash
# Build all packages
pnpm build

# Build backend only
pnpm build:api

# Build frontend only
pnpm build:web
```

#### **Testing**

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run tests with coverage
pnpm -F @todolist/backend test:coverage
```

#### **Code Quality**

```bash
# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

#### **Docker**

```bash
# Build Docker images
pnpm docker:build

# Start containers
pnpm docker:up

# Stop containers
pnpm docker:down

# View logs
pnpm docker:logs

# Clean up (remove containers, volumes, images)
pnpm docker:clean
```

#### **Cleanup**

```bash
# Remove build artifacts and node_modules
pnpm clean

# Deep clean (includes pnpm store)
pnpm clean:all
```

### First Steps

1. **Start the application**: `pnpm dev:with-infra` (starts MongoDB + backend + frontend)
2. **Open the frontend**: Navigate to `http://localhost:5173`
3. **Create an account**: Sign up with email and password
4. **Create your first todo list**: Use the sidebar to create a new list
5. **Add tasks**: Create tasks with due dates, priorities, and tags
6. **Explore features**: Try subtasks, recurring tasks, and different views
7. **Stop when done**: `pnpm dev:infra:down` to stop MongoDB

### API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs.json`

### Troubleshooting

**Port already in use?**

- Backend default: `3000` (change via `PORT` env variable)
- Frontend default: `5173` (Vite will auto-increment if busy)

**MongoDB connection issues?**

- Ensure Docker is running: `docker ps`
- Start MongoDB infrastructure: `pnpm dev:infra`
- Verify MongoDB is accessible: `docker ps | grep mongodb`
- Check connection string matches Docker Compose config (default: `mongodb://admin:password123@localhost:27017/todolist?authSource=admin`)

**Dependencies not installing?**

- Ensure you're using pnpm: `pnpm --version`
- Clear cache: `pnpm store prune`
- Delete `node_modules` and reinstall: `pnpm clean && pnpm install`

## 🏗️ Architecture

### Monorepo Structure

Built with pnpm workspaces:

```
apps/
  backend/    → Node.js/Express API
  frontend/   → React + Vite SPA

packages/
  types/      → Shared TypeScript interfaces
  config/     → Shared configuration
```

## 🧰 Tech Stack

### Backend

- Node.js + Express
- TypeScript
- MongoDB Atlas + Mongoose
- JWT authentication (access + refresh tokens)
- Zod for request validation
- Pino structured logging
- Swagger/OpenAPI documentation
- Jest (unit + integration tests)

### Frontend

- React + TypeScript
- Vite
- Redux Toolkit + RTK Query
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- React Router v6

### Infrastructure & DevOps

- Docker Compose (for local development)
- Kubernetes (EKS)
- Terraform (AWS IaC)
- AWS services:
  - EKS
  - ECR
  - VPC
  - Application Load Balancer
  - CloudFront CDN
  - CloudWatch logging & metrics

## ✨ Application Features

A comprehensive todo list application with advanced task management capabilities.

### 📋 Task Management

- **Rich Task Properties**: Name, description, due date, start date, priority (low/medium/high), tags (up to 10 per task)
- **Hierarchical Tasks**: Subtasks up to 3 levels deep with visual tree structure and cascade deletion
- **Recurring Tasks**: Daily, weekly, monthly, yearly with custom intervals
- **Task Status**: Check/uncheck with automatic completion tracking

### 📁 Organization

- **Multiple Todo Lists**: Create unlimited lists with full CRUD operations
- **Multiple Views**:
  - **Inbox**: All tasks across lists with hierarchical display
  - **Search**: Full-text search with advanced filtering
  - **Upcoming**: Tasks grouped by due dates (today, this week, overdue)
- **Filtering & Sorting**: Filter by priority, tags, due date, status; sort by due date, priority, creation date, or name

### 👤 User Experience

- **User Accounts**: Secure registration, login, and session management
- **Modern UI**: Responsive design with Tailwind CSS, shadcn/ui, dark mode support, and accessibility features
- **Mobile Optimized**: Touch-friendly interface with responsive sidebar and mobile dialogs
- **Real-Time Feedback**: Toast notifications, optimistic updates, and instant UI changes

### 🔒 Security & Performance

- **Data Security**: User isolation, input validation (Zod), XSS/CSRF protection, rate limiting
- **Performance**: Optimistic updates, RTK Query caching, efficient database queries with indexes

## 🔐 Authentication (Custom-Built)

I implemented authentication manually instead of using libraries like Passport, NextAuth, BetterAuth and Clerk because I wanted to deeply understand real-world auth flows.

### Authentication Flow Diagram

The authentication system uses a **dual-token approach** with access tokens (short-lived) and refresh tokens (long-lived) stored in HTTP-only cookies for security.

#### 1. Login/Signup Flow

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant MongoDB Atlas
    participant CookieService

    Client->>Backend: POST /api/v1/auth/login<br/>(email, password)
    Backend->>MongoDB Atlas: Find user by email
    MongoDB Atlas-->>Backend: User document
    Backend->>Backend: Verify password (bcrypt)

    alt Invalid credentials
        Backend-->>Client: 401 Unauthorized
    else Valid credentials
        Backend->>Backend: Generate Access Token (JWT)<br/>TTL: 15 minutes<br/>Contains: userId, roles, jti, exp, iat
        Backend->>MongoDB Atlas: Create Refresh Token<br/>Hash token with HMAC-SHA256<br/>Store: tokenHash, userId, familyId,<br/>expiresAt (7 days), ipAddress, userAgent
        MongoDB Atlas-->>Backend: Refresh token saved
        Backend->>CookieService: Set HTTP-only cookies
        CookieService->>Client: Set-Cookie: accessToken<br/>Set-Cookie: refreshToken
        Backend-->>Client: 200 OK + User info
    end
```

#### 2. Access Token Usage (Protected Routes)

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant AccessTokenService
    participant ProtectedRoute

    Client->>AuthMiddleware: Request with accessToken cookie<br/>or Authorization: Bearer <token>
    AuthMiddleware->>AccessTokenService: Verify token signature<br/>Check expiration (exp)<br/>Validate issuer (iss) & audience (aud)

    alt Token invalid/expired
        AccessTokenService-->>AuthMiddleware: 401 Unauthorized
        AuthMiddleware-->>Client: 401 Unauthorized
    else Token valid
        AccessTokenService-->>AuthMiddleware: Decoded payload<br/>{ userId, roles, iat, exp, jti }
        AuthMiddleware->>AuthMiddleware: Attach req.auth = payload
        AuthMiddleware->>ProtectedRoute: Call next()
        ProtectedRoute-->>Client: 200 OK + Response
    end
```

#### 3. Refresh Token Flow (Token Rotation)

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant RefreshService
    participant MongoDB Atlas
    participant AccessTokenService
    participant CookieService

    Note over Client: Access token expired (15 min)
    Client->>Backend: POST /api/v1/auth/refresh<br/>(refreshToken cookie)
    Backend->>RefreshService: Parse refresh token from cookie
    RefreshService->>RefreshService: Hash token: HMAC-SHA256<br/>(token, REFRESH_HASH_SECRET)
    RefreshService->>MongoDB Atlas: Find token by hash<br/>Check: revoked=false, expiresAt > now

    alt Token invalid/expired/revoked
        MongoDB Atlas-->>RefreshService: Token not found
        RefreshService-->>Backend: 401 Unauthorized
        Backend-->>Client: 401 Unauthorized
    else Token valid
        MongoDB Atlas-->>RefreshService: Token document found
        RefreshService->>MongoDB Atlas: Start Transaction
        RefreshService->>MongoDB Atlas: Revoke old token<br/>(set revoked=true)
        RefreshService->>MongoDB Atlas: Create new refresh token<br/>(same familyId, new hash)
        RefreshService->>MongoDB Atlas: Link old→new (replacedBy)
        RefreshService->>MongoDB Atlas: Commit Transaction
        RefreshService->>AccessTokenService: Generate new access token
        AccessTokenService-->>RefreshService: New access token (15 min)
        RefreshService->>CookieService: Set new cookies
        CookieService->>Client: Set-Cookie: new accessToken<br/>Set-Cookie: new refreshToken
        Backend-->>Client: 204 No Content
    end
```

#### 4. Token Rotation Security (Reuse Detection)

```mermaid
sequenceDiagram
    participant Attacker
    participant Backend
    participant RefreshService
    participant MongoDB Atlas

    Note over Attacker: Stolen refresh token detected
    Attacker->>Backend: POST /api/v1/auth/refresh<br/>(stolen token)
    Backend->>RefreshService: Verify token
    RefreshService->>MongoDB Atlas: Find token by hash

    alt Token already revoked (reused)
        MongoDB Atlas-->>RefreshService: Token found but revoked=true
        RefreshService->>MongoDB Atlas: Find all tokens with same familyId
        RefreshService->>MongoDB Atlas: Revoke entire token family<br/>(security: prevent token reuse)
        RefreshService-->>Backend: 401 Unauthorized
        Backend-->>Attacker: 401 Unauthorized
        Note over Backend: Legitimate user must re-login
    end
```

#### 5. Logout Flow

```mermaid
sequenceDiagram
    participant Client
    participant Backend
    participant RefreshService
    participant MongoDB Atlas
    participant CookieService

    Client->>Backend: POST /api/v1/auth/logout<br/>(accessToken cookie)
    Backend->>Backend: Verify access token
    Backend->>RefreshService: Revoke all user's refresh tokens
    RefreshService->>MongoDB Atlas: Update all tokens<br/>Set revoked=true<br/>WHERE userId = <userId>
    MongoDB Atlas-->>RefreshService: Tokens revoked
    RefreshService->>CookieService: Clear auth cookies
    CookieService->>Client: Clear-Cookie: accessToken<br/>Clear-Cookie: refreshToken
    Backend-->>Client: 204 No Content
```

### Token Details

#### Access Token (JWT)

- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256 (or RS256/RS384/RS512 if keys provided)
- **TTL**: 15 minutes (configurable)
- **Storage**: HTTP-only cookie (preferred) or Authorization header
- **Contains**:
  - `sub`: User ID
  - `roles`: User roles array
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
  - `jti`: JWT ID (unique identifier)
  - `iss`: Issuer
  - `aud`: Audience

#### Refresh Token

- **Type**: Random UUID string (not JWT)
- **TTL**: 7 days (configurable)
- **Storage**: HTTP-only cookie only
- **Security**:
  - Stored as HMAC-SHA256 hash in database
  - Never sent in response body
  - Path-restricted cookie (`/api/v1/auth/refresh`)
- **Database Fields**:
  - `tokenHash`: HMAC-SHA256 hash of token
  - `userId`: Owner reference
  - `familyId`: Token family (for rotation tracking)
  - `issuedAt`: Creation timestamp
  - `expiresAt`: Expiration timestamp
  - `revoked`: Boolean flag
  - `replacedBy`: Reference to new token (rotation chain)
  - `ipAddress`: IP at creation
  - `userAgent`: Browser/client info
  - `lastUsedAt`: Last usage timestamp

### Security Features

1. **HTTP-Only Cookies**: Prevents XSS attacks (JavaScript cannot access)
2. **Token Rotation**: Refresh tokens are rotated on each use (old token revoked, new one issued)
3. **Token Families**: Related tokens grouped by `familyId` for reuse detection
4. **Reuse Detection**: If a refresh token is reused, entire family is revoked
5. **Transactional Rotation**: Uses MongoDB Atlas transactions for atomic token rotation
6. **Path Restrictions**: Refresh token cookie only sent to `/api/v1/auth/refresh`
7. **Secure Flags**: Cookies use `Secure` flag in production, `SameSite` protection
8. **Rate Limiting**: Auth endpoints have stricter rate limits (10 req/15min)
9. **IP/User-Agent Tracking**: Stored for security auditing
10. **Automatic Expiration**: Both tokens expire automatically

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    User Authentication                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │   Login/Signup Success           │
        │   • Access Token (15 min)        │
        │   • Refresh Token (7 days)      │
        └───────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌──────────────────────┐
│  Access Token     │              │   Refresh Token      │
│  (Short-lived)    │              │   (Long-lived)        │
│                   │              │                      │
│  • API Requests   │              │  • Token Refresh     │
│  • 15 min TTL    │              │  • 7 days TTL        │
│  • Auto-expires   │              │  • Rotated on use    │
└───────────────────┘              └──────────────────────┘
        │                                       │
        │ Expired?                              │
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌──────────────────────┐
│  Request New      │─────────────▶│  Refresh Endpoint    │
│  Access Token     │              │                      │
└───────────────────┘              │  • Verify refresh    │
                                  │  • Rotate refresh    │
                                  │  • Issue new tokens  │
                                  └──────────────────────┘
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │  New Token Pair   │
                                  │  • New Access     │
                                  │  • New Refresh    │
                                  └───────────────────┘
```

## ☁️ AWS Infrastructure Architecture

Production-ready deployment on AWS using Kubernetes, containerization, and managed services.

### Architecture Diagram

```mermaid
graph TB
    subgraph "Internet"
        Users[👥 Users]
    end

    subgraph "AWS Cloud"
        CF[CloudFront CDN<br/>SSL/TLS, Global CDN]
        S3[S3 Bucket<br/>Static Frontend]
        ALB[Application Load Balancer<br/>SSL Termination, Health Checks]

        subgraph "VPC - 10.0.0.0/16"
            subgraph "EKS Cluster"
                EKS[EKS Control Plane]
                BackendPods[Backend Pods<br/>Express API, 2+ Replicas]
            end
        end

        ECR[ECR Repositories<br/>Container Images]
        CW[CloudWatch<br/>Logs, Metrics, Alarms]
    end

    subgraph "External"
        MongoAtlas[(MongoDB Atlas<br/>Managed Database)]
    end

    Users -->|HTTPS| CF
    CF -->|Static Assets| S3
    CF -->|API Requests| ALB
    ALB -->|/api/*| BackendPods
    BackendPods -->|Database Connection| MongoAtlas
    BackendPods -.->|Logs| CW
    ECR -->|Pull Images| BackendPods

    style CF fill:#FF9900,stroke:#232F3E,stroke-width:2px
    style S3 fill:#569A31,stroke:#232F3E,stroke-width:2px
    style ALB fill:#FF9900,stroke:#232F3E,stroke-width:2px
    style EKS fill:#FF9900,stroke:#232F3E,stroke-width:2px
    style ECR fill:#FF9900,stroke:#232F3E,stroke-width:2px
    style CW fill:#FF9900,stroke:#232F3E,stroke-width:2px
    style BackendPods fill:#4A90E2,stroke:#2C3E50,stroke-width:2px
    style MongoAtlas fill:#13AA52,stroke:#2C3E50,stroke-width:2px
```

### Key Components

- **CloudFront**: Global CDN with SSL/TLS termination, routes static assets to S3 and API requests to ALB
- **S3**: Static hosting for React frontend build artifacts
- **ALB**: Application Load Balancer with SSL termination, health checks, and path-based routing to EKS
- **EKS**: Managed Kubernetes cluster (1.28+) with auto-scaling node groups (1-3 nodes, t3.medium)
- **ECR**: Private Docker registry for backend/frontend images with vulnerability scanning
- **CloudWatch**: Log aggregation, metrics, alarms, and dashboards
- **MongoDB Atlas**: Managed MongoDB database (external service)

### Data Flow

- **Frontend**: `User → CloudFront → S3 → React App`
- **API**: `User → CloudFront → ALB → EKS → Backend Pods → MongoDB Atlas`
- **Deployment**: `CI/CD → Build → ECR → EKS → Rolling Update`

### Infrastructure Features

- **Security**: VPC isolation, SSL/TLS encryption, IAM roles, security groups, container security (non-root, read-only filesystems)
- **Scalability**: Auto-scaling EKS nodes and pods, CloudFront caching, configurable resource limits
- **High Availability**: Multi-AZ deployment, load balancing, health checks, automatic pod replacement
- **Monitoring**: CloudWatch logs, metrics, alarms, SNS notifications
- **Infrastructure as Code**: Terraform modules for all AWS resources

All infrastructure is defined in Terraform modules located in `terraform/aws/modules/`.

## Design Decisions, Opinions and Lessons

1. React & Vite
   When I first built this app, I hadn’t explored Next.js yet, so React + Vite made sense.
   If I were building this today, I would likely choose Next.js for its built-in routing, server actions, and integrated backend capabilities.

2. Tailwind CSS & shadcn/ui
   The original version used Styled Components.
   During the rebuild, I switched to Tailwind CSS and shadcn/ui to get:

- modern, accessible components
- a consistent design system
- faster iteration without manually styling everything
- This change dramatically improved both development speed and UI quality.

3. Redux & RTK Query
   I initially chose Redux because it was the “standard” at the time.
   If I were starting today, I’d pick Zustand for state management and React Query for data fetching to reduce boilerplate and simplify the overall architecture.

RTK Query works great, but it’s more than this project realistically needs.

4. Express
   Express made sense for learning the fundamentals of REST APIs.
   However, today I wouldn’t use Express for a new production project.
   My preferred modern options:

- Next.js → server actions + simple backend without extra infrastructure
- NestJS → opinionated structure + built-in dependency injection (something I now really value)

Express is great for education or building your own framework, but not my first choice for real apps anymore.

5. Custom Auth
   I built the authentication system from scratch to truly understand how access tokens, refresh tokens, rotation, and session invalidation work.

- However, I wouldn’t implement custom auth for a real production app because:
- mature solutions already exist (Clerk, NextAuth, BetterAuth, etc.)
- maintaining your own auth layer is costly
- features like OAuth, Google login, and SSO take minutes with managed auth but weeks when building them manually

This project taught me how auth works, but modern apps should outsource authentication when possible.

6. Kubernetes + Terraform
   Using Kubernetes here is objectively overkill.
   I used it purely for learning:

- cluster setup
- ingress controllers
- deployments & services
- infrastructure as code with Terraform

Realistically, this project would be far simpler using:

- serverless (AWS Lambda)
- Vercel
- or any managed container service

Kubernetes excels in large systems and microservice environments, not small full-stack apps.

7. S3 for the frontend
   At first, I considered running the frontend inside Kubernetes, but running an NGINX container just to serve static files made no sense.

Hosting the frontend on S3 + CloudFront is simpler, cheaper, and faster for static React builds.

If I had used Next.js, I could justify running it in Kubernetes since it provides a real server component. Static React files don’t.

8. Why Only MongoDB Runs in Local Docker Compose
   I don’t run the backend or frontend in Docker locally because hot reload becomes unreliable in monorepos, especially with pnpm.

The main issues:

- pnpm + Docker volume mounts don’t work well in monorepos
- hot reload was inconsistent
- developing directly on the host machine is faster and smoother
- Docker would add unnecessary complexity to local dev

Running only MongoDB in Docker strikes the right balance:
simple local dev + isolated database environment.
