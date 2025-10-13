# Deployment Guide

This guide covers various deployment options for the Collaborative Code Editor.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Compose](#docker-compose)
- [Kubernetes](#kubernetes)
- [Cloud Providers](#cloud-providers)
  - [AWS](#aws)
  - [Google Cloud](#google-cloud)
  - [Azure](#azure)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Kubernetes 1.24+ (for Kubernetes deployment)
- kubectl (for Kubernetes deployment)
- Helm 3.0+ (for Kubernetes deployment)

## Local Development

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/collaborative-code-editor.git
   cd collaborative-code-editor
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration.

4. Start the services:
   ```bash
   docker-compose up -d
   ```

5. Access the application at `http://localhost:3000`

### Manual Setup

1. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

2. Set up the database:
   ```bash
   cd ../server
   npx prisma migrate dev
   ```

3. Start the development servers:
   ```bash
   # In one terminal (backend)
   cd server
   npm run dev
   
   # In another terminal (frontend)
   cd client
   npm run dev
   ```

## Docker Compose

### Production Deployment

1. Update the `.env` file with production values.

2. Build and start the containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. Run database migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=collaborative_editor
DATABASE_URL=postgresql://postgres:your-secure-password@db:5432/collaborative_editor?schema=public

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

## Kubernetes

### Prerequisites

- A running Kubernetes cluster
- kubectl configured to connect to your cluster
- Helm 3.0+
- cert-manager (for TLS certificates)
- ingress-nginx (for ingress)

### Deployment Steps

1. Install the required CRDs:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.10.0/cert-manager.crds.yaml
   ```

2. Add the Helm repositories:
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update
   ```

3. Install cert-manager:
   ```bash
   helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --version v1.10.0
   ```

4. Install ingress-nginx:
   ```bash
   helm install nginx-ingress ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
   ```

5. Create a namespace for the application:
   ```bash
   kubectl create namespace code-editor
   ```

6. Create the required secrets:
   ```bash
   kubectl create secret generic backend-secrets -n code-editor \
     --from-literal=JWT_SECRET=your-jwt-secret \
     --from-literal=DATABASE_URL=postgresql://postgres:your-password@postgres-service:5432/collaborative_editor
   ```

7. Deploy the application:
   ```bash
   kubectl apply -f k8s/ -n code-editor
   ```

8. Verify the deployment:
   ```bash
   kubectl get all -n code-editor
   ```

## Cloud Providers

### AWS

#### ECS Deployment

1. Install and configure the AWS CLI:
   ```bash
   aws configure
   ```

2. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name collaborative-editor
   ```

3. Build and push the Docker images:
   ```bash
   # Build the images
   docker-compose -f docker-compose.prod.yml build
   
   # Tag the images
   docker tag collaborative-editor-frontend:latest 123456789012.dkr.ecr.region.amazonaws.com/collaborative-editor/frontend:latest
   docker tag collaborative-editor-backend:latest 123456789012.dkr.ecr.region.amazonaws.com/collaborative-editor/backend:latest
   
   # Push the images
   aws ecr get-login-password --region region | docker login --username AWS --password-stdin 123456789012.dkr.ecr.region.amazonaws.com
   docker push 123456789012.dkr.ecr.region.amazonaws.com/collaborative-editor/frontend:latest
   docker push 123456789012.dkr.ecr.region.amazonaws.com/collaborative-editor/backend:latest
   ```

4. Create an ECS cluster and deploy the application using the AWS Management Console or AWS CDK.

### Google Cloud

#### Google Kubernetes Engine (GKE)

1. Install and initialize the Google Cloud SDK:
   ```bash
   gcloud init
   ```

2. Create a GKE cluster:
   ```bash
   gcloud container clusters create collaborative-editor \
     --num-nodes=3 \
     --machine-type=e2-medium \
     --zone=us-central1-a
   ```

3. Configure kubectl:
   ```bash
   gcloud container clusters get-credentials collaborative-editor --zone=us-central1-a
   ```

4. Deploy the application using the Kubernetes manifests in the `k8s/` directory.

### Azure

#### Azure Kubernetes Service (AKS)

1. Install the Azure CLI:
   ```bash
   az login
   ```

2. Create a resource group:
   ```bash
   az group create --name collaborative-editor --location eastus
   ```

3. Create an AKS cluster:
   ```bash
   az aks create \
     --resource-group collaborative-editor \
     --name collaborative-editor-cluster \
     --node-count 3 \
     --enable-addons monitoring \
     --generate-ssh-keys
   ```

4. Configure kubectl:
   ```bash
   az aks get-credentials --resource-group collaborative-editor --name collaborative-editor-cluster
   ```

5. Deploy the application using the Kubernetes manifests in the `k8s/` directory.

## Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: code-editor
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Scaling

For production workloads, consider:
- Using a managed database service (e.g., Amazon RDS, Google Cloud SQL, Azure Database for PostgreSQL)
- Setting up read replicas for read-heavy workloads
- Implementing connection pooling with PgBouncer

## Monitoring

### Prometheus and Grafana

1. Install the kube-prometheus-stack:
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
   ```

2. Access Grafana:
   ```bash
   kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
   ```
   Open http://localhost:3000 and log in with admin/prom-operator

### Application Logs

```bash
# View logs for a specific pod
kubectl logs -f <pod-name> -n code-editor

# View logs with label selector
kubectl logs -f -l app=collaborative-editor -n code-editor

# View logs from multiple containers
kubectl logs -f deployment/backend -n code-editor -c backend
```

## Backup and Recovery

### Database Backups

#### PostgreSQL Backup

```bash
# Create a backup
kubectl exec -n code-editor $(kubectl get pods -n code-editor -l app=postgres -o name) -- pg_dump -U postgres collaborative_editor > backup.sql

# Restore from backup
cat backup.sql | kubectl exec -i -n code-editor $(kubectl get pods -n code-editor -l app=postgres -o name) -- psql -U postgres collaborative_editor
```

#### Scheduled Backups with Kubernetes CronJob

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: code-editor
spec:
  schedule: "0 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:14-alpine
            command: ["sh", "-c"]
            args:
              - |
                PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h postgres-service -U postgres collaborative_editor > /backup/backup-$(date +%Y%m%d).sql
                gzip /backup/backup-$(date +%Y%m%d).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
```

### Disaster Recovery

1. **Regular Backups**: Schedule regular database and file system backups.
2. **Disaster Recovery Plan**: Document the recovery process for different failure scenarios.
3. **Test Restores**: Periodically test the restore process to ensure backups are valid.
4. **Multi-Region Deployment**: For high availability, deploy the application in multiple regions.

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify the database is running and accessible
   - Check database credentials in the configuration
   - Ensure the database user has the correct permissions

2. **WebSocket Connection Issues**:
   - Check if the WebSocket server is running
   - Verify CORS settings
   - Check for network/firewall issues

3. **Performance Issues**:
   - Monitor resource usage (CPU, memory, disk I/O)
   - Check for slow database queries
   - Review application logs for errors or warnings

### Getting Help

If you encounter any issues, please:
1. Check the [Troubleshooting Guide](../troubleshooting/README.md)
2. Search the [GitHub Issues](https://github.com/your-username/collaborative-code-editor/issues)
3. Open a new issue if your problem hasn't been reported
