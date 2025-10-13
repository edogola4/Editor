#!/bin/bash
set -e

# Load environment variables
source .env

# Base64 encode secrets for Kubernetes
export DB_PASSWORD=$(echo -n "$DB_PASSWORD" | base64)
export JWT_SECRET_BASE64=$(echo -n "$JWT_SECRET" | base64)
export GITHUB_CLIENT_ID_BASE64=$(echo -n "$GITHUB_CLIENT_ID" | base64)
export GITHUB_CLIENT_SECRET_BASE64=$(echo -n "$GITHUB_CLIENT_SECRET" | base64)
export REDIS_PASSWORD=$(echo -n "$REDIS_PASSWORD" | base64)

# Apply configurations
kubectl apply -f k8s/backend/config.yaml
kubectl apply -f k8s/frontend/config.yaml

# Deploy database
kubectl apply -f k8s/db/statefulset.yaml
kubectl apply -f k8s/redis/statefulset.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=code-editor,tier=database --timeout=300s
kubectl wait --for=condition=ready pod -l app=code-editor,tier=cache --timeout=300s

# Deploy backend and frontend
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/frontend/deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress/ingress.yaml

# Output deployment status
echo "Deployment complete!"
kubectl get pods,svc,ingress
