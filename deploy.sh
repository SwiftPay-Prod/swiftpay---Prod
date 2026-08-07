#!/bin/bash
set -e

VERSION=${1:-latest}
HOST=${DEPLOY_HOST:-169.58.70.201}
USER=${DEPLOY_USER:-root}
# Credencial deve vir de variavel de ambiente — nunca hardcode
PASS=${DEPLOY_PASS:?DEPLOY_PASS nao definido}
REMOTE_DIR=/root/swiftpay/swiftpay-api

echo "=== Deploying SwiftPay v${VERSION} to ${HOST} ==="

# 1. Copy docker-compose
echo "Copying docker-compose.production.yaml..."
sshpass -p "${PASS}" scp -o StrictHostKeyChecking=no swiftpay-api/docker-compose.production.yaml "${USER}@${HOST}:${REMOTE_DIR}/docker-compose.production.yaml"

# 2. Copy .env.production if exists (as both .env and .env.production)
if [ -f .env.production ]; then
  echo "Copying .env.production..."
  sshpass -p "${PASS}" scp -o StrictHostKeyChecking=no .env.production "${USER}@${HOST}:${REMOTE_DIR}/.env.production"
  sshpass -p "${PASS}" ssh -o StrictHostKeyChecking=no "${USER}@${HOST}" "cp ${REMOTE_DIR}/.env.production ${REMOTE_DIR}/.env"
fi

# 3. SSH and deploy
sshpass -p "${PASS}" ssh -o StrictHostKeyChecking=no "${USER}@${HOST}" bash -s << EOF
  cd ${REMOTE_DIR}
  echo "Pulling latest code..."
  cd /root/swiftpay/swiftpay-api && git pull 2>/dev/null || echo "Git pull failed, continuing..."
  
  echo "Building and starting containers..."
  VERSION=${VERSION} docker compose -f docker-compose.production.yaml up -d --build
  
  echo "Waiting for health checks..."
  sleep 10
  
  echo "Container status:"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF

echo "=== Deploy complete ==="
echo "Site: https://swiftpayment.info"
