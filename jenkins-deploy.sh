#!/bin/bash

# Jenkins Deployment Script for Ingestion Service

echo "Starting Deployment..."

# 1. Clean up workspace artifacts (if any)
rm -f .env

# 2. Create .env file from Jenkins Environment Variables
# Ensure you have configured these secrets in Jenkins Credentials/Environment
echo "Creating .env file..."
cat <<EOF > .env
PORT=3000
POLL_INTERVAL=3000

# TimescaleDB Configuration
ENABLE_DB_WRITE=true
POSTGRES_HOST=\${POSTGRES_HOST}
POSTGRES_PORT=\${POSTGRES_PORT}
POSTGRES_USER=\${POSTGRES_USER}
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
POSTGRES_DB=\${POSTGRES_DB}
EOF

# 3. Docker Deployment
echo "Building and Deploying containers..."
docker-compose down --remove-orphans
docker-compose up -d --build

# 4. Cleanup
echo "Pruning unused images..."
docker image prune -f

echo "Deployment Complete!"
