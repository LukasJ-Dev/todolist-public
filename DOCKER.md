# Docker Setup for Todolist Monorepo

This document explains how to run the Todolist application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Production Mode

```bash
# Build and start all services
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop services
pnpm run docker:down
```

### Development Mode

```bash
# Start development environment
pnpm run docker:dev

# View logs
pnpm run docker:dev:logs

# Stop development environment
pnpm run docker:dev:down
```

## Services

### MongoDB Database

- **Port**: 27017
- **Username**: admin
- **Password**: password123
- **Database**: todolist
- **Application User**: todolist_user / todolist_password

### Backend API

- **Port**: 3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api-docs

### Frontend

- **Port**: 80
- **URL**: http://localhost
- **Health Check**: http://localhost/health

## Environment Variables

The Docker setup includes default environment variables. For production, you should:

1. Copy `env.production.example` to `.env` for production
2. Copy `env.docker.example` to `.env` for development
3. Update the values with your actual secrets
4. The docker-compose files will automatically use your `.env` file

### Important Variables to Change

```bash
# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_HASH_SECRET=your-super-secret-refresh-hash-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this-in-production

# Database (if using external MongoDB)
DATABASE=mongodb://your-connection-string

# CORS (if frontend is on different domain)
CORS_ORIGIN=https://your-frontend-domain.com
```

## Available Commands

### Production Commands

```bash
pnpm run docker:build    # Build all Docker images
pnpm run docker:up       # Start all services in background
pnpm run docker:down     # Stop all services
pnpm run docker:logs     # View logs from all services
pnpm run docker:clean    # Remove all containers, volumes, and images
```

### Development Commands

```bash
pnpm run docker:dev      # Start development environment
pnpm run docker:dev:down # Stop development environment
pnpm run docker:dev:logs # View development logs
```

## Development vs Production

### Development Mode (`docker-compose.dev.yml`)

- Backend runs in development mode with hot reload
- More permissive rate limiting
- Debug logging enabled
- Source code is mounted as volumes for live updates

### Production Mode (`docker-compose.yml`)

- Optimized multi-stage builds
- Production-ready configurations
- Health checks for all services
- Proper security settings

## Database Management

### Accessing MongoDB

```bash
# Connect to MongoDB container
docker exec -it todolist-mongodb mongosh

# Or connect from host
mongosh mongodb://admin:password123@localhost:27017/todolist?authSource=admin
```

### Database Initialization

The MongoDB container automatically:

1. Creates the `todolist` database
2. Creates a `todolist_user` with read/write permissions
3. Sets up initial indexes for optimal performance

### Backup and Restore

```bash
# Backup database
docker exec todolist-mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/todolist?authSource=admin" --out /backup

# Copy backup from container
docker cp todolist-mongodb:/backup ./mongodb-backup

# Restore database
docker exec -i todolist-mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/todolist?authSource=admin" /backup/todolist
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 80, 3000, and 27017 are not in use
2. **Permission issues**: On Linux/macOS, you might need to run with `sudo`
3. **Memory issues**: Ensure Docker has enough memory allocated

### Viewing Logs

```bash
# All services
pnpm run docker:logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restarting Services

```bash
# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up --build backend
```

### Cleanup

```bash
# Remove everything (containers, volumes, images)
pnpm run docker:clean

# Remove only containers and volumes
docker-compose down -v

# Remove unused images
docker image prune
```

## Security Considerations

1. **Change default passwords** in production
2. **Use environment files** for sensitive data
3. **Enable HTTPS** in production
4. **Use secrets management** for production deployments
5. **Regular security updates** of base images

## Performance Optimization

1. **Resource limits**: Add memory and CPU limits to services
2. **Health checks**: All services include health checks
3. **Database indexes**: Pre-configured for optimal performance
4. **Nginx caching**: Frontend includes static asset caching
5. **Multi-stage builds**: Optimized image sizes

## Monitoring

### Health Checks

- Backend: `GET /health`
- Frontend: `GET /health`
- MongoDB: Built-in ping check

### Logs

- Structured JSON logging with Pino
- Request correlation IDs
- Error tracking and monitoring

## Next Steps

1. Set up CI/CD pipeline with Docker
2. Configure monitoring and alerting
3. Set up automated backups
4. Implement blue-green deployments
5. Add load balancing for production
