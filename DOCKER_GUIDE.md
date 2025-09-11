# Docker in Monorepo: Complete Guide

This guide explains how to handle Docker in a monorepo setup, specifically for this todolist project.

## 🏗️ Architecture Overview

Our monorepo uses a workspace-based approach with:

- **Root workspace**: Contains shared configuration and Docker setup
- **Apps**: `backend` and `frontend` applications
- **Packages**: Shared libraries (`@todolist/config`, `@todolist/types`)

## 📁 Docker File Structure

```
├── docker-compose.yml          # Base production configuration
├── docker-compose.dev.yml      # Development configuration
├── docker-compose.override.yml # Local development overrides
├── docker-compose.prod.yml     # Production overrides
├── .dockerignore              # Files to exclude from Docker context
├── docker/
│   └── Dockerfile.base        # Shared base Dockerfile
└── apps/
    ├── backend/
    │   ├── Dockerfile         # Production backend image
    │   └── Dockerfile.dev     # Development backend image
    └── frontend/
        └── Dockerfile         # Frontend image
```

## 🚀 Quick Start Commands

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start with local overrides
docker-compose up
```

### Production

```bash
# Build and start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Or use the base configuration
docker-compose up --build
```

## 🔧 Key Docker Strategies for Monorepos

### 1. Build Context Management

- **Root context**: All Dockerfiles use the root directory as build context (`context: .`)
- **Selective copying**: Use `.dockerignore` to exclude unnecessary files
- **Layer optimization**: Copy package.json files first for better caching

### 2. Workspace Dependency Handling

```dockerfile
# Copy all package.json files for dependency resolution
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies (cached if package.json files don't change)
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @todolist/config --filter @todolist/types build

# Then build the specific app
RUN pnpm --filter backend build
```

### 3. Multi-Stage Builds

- **Base stage**: Common Node.js setup and dependencies
- **Build stage**: Compile TypeScript and build packages
- **Production stage**: Minimal runtime image with only production dependencies

### 4. Environment-Specific Configurations

#### Development

- Hot reloading with volume mounts
- Development dependencies included
- Debug logging enabled
- Faster build times

#### Production

- Optimized multi-stage builds
- Security hardening (non-root user)
- Health checks
- Resource limits

## 📦 Volume Management

### Development Volumes

```yaml
volumes:
  # Source code for hot reloading (not read-only for dev)
  - ./apps/backend/src:/app/apps/backend/src
  - ./packages:/app/packages

  # Node modules for performance (avoid wildcard patterns)
  - backend_node_modules:/app/node_modules
```

### Production Volumes

```yaml
volumes:
  # Data persistence
  - mongodb_data:/data/db
```

## 🔒 Security Best Practices

1. **Non-root user**: All production containers run as non-root
2. **Minimal base images**: Using Alpine Linux variants
3. **Dependency scanning**: Regular security updates
4. **Secrets management**: Environment variables for sensitive data
5. **Network isolation**: Custom networks for service communication

## 🚀 Performance Optimizations

### Build Performance

- **Layer caching**: Package.json files copied first
- **Parallel builds**: Multi-stage builds with parallel stages
- **Selective copying**: Only copy necessary files

### Runtime Performance

- **Resource limits**: CPU and memory constraints
- **Health checks**: Proper service health monitoring
- **Connection pooling**: Database connection optimization

## 🛠️ Development Workflow

### Local Development

1. Use `docker-compose up` for automatic override loading
2. Source code changes trigger hot reloading
3. Database persists between restarts
4. Easy debugging with development tools

### CI/CD Integration

```bash
# Build for specific platform
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .

# Multi-environment deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## 📊 Monitoring and Debugging

### Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging

- Structured logging in production
- Pretty logging in development
- Centralized log collection ready

## 🔄 Common Commands

```bash
# Rebuild specific service
docker-compose build backend

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh

# Clean up
docker-compose down -v
docker system prune -a
```

## 🎯 Best Practices Summary

1. **Use build context at root** for monorepo compatibility
2. **Optimize layer caching** with strategic file copying
3. **Separate dev/prod configurations** for different needs
4. **Use multi-stage builds** for production optimization
5. **Implement proper health checks** for reliability
6. **Mount volumes strategically** for development efficiency
7. **Use override files** for environment-specific customizations
8. **Keep images minimal** with Alpine Linux and proper cleanup

## 🚨 Troubleshooting

### Common Issues

1. **Build failures**: Check package.json dependencies and workspace configuration
2. **Permission issues**: Ensure proper user setup in Dockerfiles
3. **Volume mounting**: Verify paths and permissions for development volumes
4. **Network connectivity**: Check service dependencies and network configuration
5. **Module not found errors**: Ensure all dependencies are installed in the correct order
6. **Lockfile issues**: Run `pnpm install` locally to update the lockfile before building

### Debug Commands

```bash
# Check container status
docker-compose ps

# Inspect container
docker-compose exec backend sh

# View build logs
docker-compose build --no-cache backend
```
