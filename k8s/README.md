# Kubernetes Manifests

This directory contains the Kubernetes manifests for deploying the todolist application to AWS EKS.

## Files

- `namespace.yaml` - Creates the `todolist` namespace
- `configmap.yaml` - Application configuration
- `secret.yaml` - Sensitive data (JWT secrets, database URL)
- `backend-deployment.yaml` - Backend application deployment
- `backend-service.yaml` - Backend service
- `ingress.yaml` - ALB ingress configuration

## Placeholders

The following placeholders are replaced by the deployment script:

- `{{ECR_BACKEND_URL}}` - ECR repository URL for backend image
- `{{ECR_FRONTEND_URL}}` - ECR repository URL for frontend image
- `{{JWT_SECRET}}` - JWT secret key
- `{{REFRESH_HASH_SECRET}}` - Refresh token hash secret
- `{{DATABASE_URL}}` - MongoDB connection string

## Security Features

- Non-root user (UID 1000)
- Read-only root filesystem
- Dropped capabilities
- Resource limits and requests
- Health checks (liveness and readiness)

## Usage

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n todolist
kubectl get services -n todolist
kubectl get ingress -n todolist

# View logs
kubectl logs -f deployment/backend -n todolist
```
