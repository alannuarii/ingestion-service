#!/bin/bash

CONTAINER_NAME="ingestion-service"
IMAGE_NAME="ingestion-service"

echo "🚀 Starting Deployment for $CONTAINER_NAME..."

# 1. Stop and Clean old container
echo "🛑 Stopping and Removing old service..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# Optional: Remove old image to force fresh build
docker rmi $IMAGE_NAME || true

# 2. Build Image
# We build from the current directory (.)
echo "🏗️  Building Docker Image..."
docker build -t $IMAGE_NAME .

# 3. Run Container
# Menggunakan --network host untuk mengatasi masalah koneksi ke 10.10.10.100 (Firewall/Routing)
echo "🐳 Running Container..."
docker run -d \
  --network host \
  --name $CONTAINER_NAME \
  --restart always \
  -e PORT=5040 \
  -e POLL_INTERVAL=3000 \
  -e ENABLE_DB_WRITE=true \
  -e POSTGRES_HOST=${POSTGRES_HOST} \
  -e POSTGRES_PORT=${POSTGRES_PORT} \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=${POSTGRES_DB} \
  $IMAGE_NAME

# 4. Cleanup
echo "🧹 Pruning unused images..."
docker image prune -f

echo "✅ Deployment Complete!"
