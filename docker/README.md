# Docker Configuration

This directory contains all Docker-related files for the TodoList monorepo.

## Structure

```
docker/
├── Dockerfile.base              # Shared foundation for all Node.js services
├── Dockerfile.backend           # Production backend container
├── Dockerfile.backend.dev       # Development backend container
├── Dockerfile.frontend          # Production frontend container
├── Dockerfile.frontend.dev      # Development frontend container
├── mongodb/
│   └── init-mongo.js           # MongoDB initialization script
└── README.md                   # This file
```

## Usage

### Production

```bash
# Build and run all services
docker-compose up --build

# Build and run specific service
docker-compose up --build backend
docker-compose up --build frontend
```

### Development

```bash
# Build and run development environment
docker-compose -f docker-compose.dev.yml up --build

# Build and run specific development service
docker-compose -f docker-compose.dev.yml up --build backend
```

## Dockerfiles

### Dockerfile.base

- **Purpose**: Shared foundation for all Node.js services
- **Features**:
  - Node.js 18 Alpine base
  - pnpm package manager
  - Common utilities (curl, dumb-init)
  - Non-root user setup
  - Workspace configuration

### Dockerfile.backend

- **Purpose**: Production backend container
- **Features**:
  - Multi-stage build for optimization
  - Builds shared packages first
  - Production-ready with health checks
  - Non-root user execution

### Dockerfile.backend.dev

- **Purpose**: Development backend container
- **Features**:
  - Hot reloading support
  - Development dependencies
  - Source code mounting for live updates

### Dockerfile.frontend

- **Purpose**: Production frontend container
- **Features**:
  - Multi-stage build with nginx
  - Optimized static file serving
  - Health checks
  - Non-root user execution

### Dockerfile.frontend.dev

- **Purpose**: Development frontend container
- **Features**:
  - Vite development server
  - Hot module replacement
  - Development dependencies

## Benefits of Centralized Structure

1. **Consistency**: All containers use the same base image and patterns
2. **Maintainability**: Single location for Docker-related changes
3. **Layer Caching**: Better Docker layer caching across services
4. **Separation of Concerns**: Apps focus on code, Docker focuses on containers
5. **CI/CD Friendly**: Single directory for all container builds

## Environment Variables

Each service requires specific environment variables. See:

- `apps/backend/env.example` for backend configuration
- Root `.env` file for shared configuration

## Health Checks

All services include health checks:

- **Backend**: `GET /health` endpoint
- **Frontend**: `GET /` endpoint
- **MongoDB**: `mongosh` ping command

## Security

- All containers run as non-root users
- Minimal Alpine Linux base images
- No unnecessary packages or tools
- Proper file permissions and ownership
