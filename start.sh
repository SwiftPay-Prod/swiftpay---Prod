#!/usr/bin/env bash
set -e

# AVISO: este script é somente para desenvolvimento local.
# NÃO execute em produção. Use docker-compose.production.yaml.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOTNET_PATH="/home/matspectrum-ai/dotnet10"

echo "========================================="
echo "  SwiftPay - Iniciando todos os servicos"
echo "========================================="

# ──────────────────────────────────────────────
# 1. Infraestrutura (Docker)
# ──────────────────────────────────────────────
echo ""
echo "[1/5] Infraestrutura Docker..."
cd "$ROOT_DIR/swiftpay-api"
docker compose -f docker-compose.development.yaml up -d \
  swiftpaydb swiftpaylogsdb swiftpaymail \
  swiftpayrabbitmq swiftpayvalkey swiftpaystorage \
  swiftpaystorage-init
echo "  OK - PostgreSQL, RabbitMQ, Valkey, MinIO, MailHog"

# ──────────────────────────────────────────────
# 2. API Principal (.NET 10 - Porta 5279)
# ──────────────────────────────────────────────
echo ""
echo "[2/5] API Principal (5279)..."
export ASPNETCORE_ENVIRONMENT="Development"
export ASPNETCORE_URLS="http://0.0.0.0:5279"
export DatabaseSettings__ConnectionString="Host=localhost;Port=5432;Database=swiftpay;Username=swiftpayuser;Password=swiftpaypassword"
export LogsDatabaseSettings__ConnectionString="Host=localhost;Port=5433;Database=swiftpaylogs;Username=logsuser;Password=logspassword"
export JWTSettings__Secret="local_dev_api_jwt_secret_change_me_2026"
export JWTSettings__Issuer="swiftpay"
export JWTSettings__Audience="swiftpay"
export RabbitMQSettings__HostName="localhost"
export RabbitMQSettings__Port="5672"
export RabbitMQSettings__UserName="swiftpayuser"
export RabbitMQSettings__Password="swiftpaypassword"
export RabbitMQSettings__VirtualHost="swiftpay"
export ValkeySettings__ConnectionString="localhost:6379"
export StorageSettings__Endpoint="localhost:9000"
export StorageSettings__AccessKey="local_dev_storage_access_key"
export StorageSettings__SecretKey="local_dev_storage_secret_key"
export StorageSettings__BucketName="swiftpay-storage"
export StorageSettings__UseSSL="false"
export StorageSettings__PublicUrl="http://localhost:9000/swiftpay-storage"
export EmailSettings__Provider="Smtp"
export EmailSettings__FromEmail="noreply@swiftpay.com.br"
export EmailSettings__FromName="SWIFTPAY"
export EmailSettings__EnableSend="true"
export EmailSettings__Smtp__Host="localhost"
export EmailSettings__Smtp__Port="1025"
export EmailSettings__Smtp__EnableSsl="false"
export PlatformSettings__BaseUrl="http://localhost:5001"
export PlatformSettings__MaxLoginAttempts="5"

cd "$ROOT_DIR/swiftpay-api"
nohup "$DOTNET_PATH/dotnet" run --project swiftpay-api.csproj > /tmp/swiftpay-api.log 2>&1 &
API_PID=$!
echo "  PID: $API_PID - Log: /tmp/swiftpay-api.log"

# ──────────────────────────────────────────────
# 3. Payment API (.NET 10 - Porta 5166)
# ──────────────────────────────────────────────
echo ""
echo "[3/5] Payment API (5166)..."
export ASPNETCORE_URLS="http://0.0.0.0:5166"
export DatabaseSettings__ConnectionString="Host=localhost;Port=5432;Database=swiftpay;Username=swiftpayuser;Password=swiftpaypassword"
export LogsDatabaseSettings__ConnectionString="Host=localhost;Port=5433;Database=swiftpaylogs;Username=logsuser;Password=logspassword"
export JWTSettings__Secret="local_dev_payment_jwt_secret_change_me_2026"
export RabbitMQSettings__HostName="localhost"
export RabbitMQSettings__Port="5672"
export RabbitMQSettings__UserName="swiftpayuser"
export RabbitMQSettings__Password="swiftpaypassword"
export RabbitMQSettings__VirtualHost="swiftpay"

cd "$ROOT_DIR/swiftpay-api-payment"
nohup "$DOTNET_PATH/dotnet" run --project swiftpay-api-payment.csproj > /tmp/swiftpay-payment.log 2>&1 &
PAYMENT_PID=$!
echo "  PID: $PAYMENT_PID - Log: /tmp/swiftpay-payment.log"

# ──────────────────────────────────────────────
# 4. Web (Next.js - Porta 5001)
# ──────────────────────────────────────────────
echo ""
echo "[4/5] Web (5001)..."
export NEXT_PUBLIC_API_URL="http://localhost:5279"
cd "$ROOT_DIR/swiftpay-web"
nohup npx next dev --port 5001 > /tmp/swiftpay-web.log 2>&1 &
WEB_PID=$!
echo "  PID: $WEB_PID - Log: /tmp/swiftpay-web.log"

# ──────────────────────────────────────────────
# 5. Checkout (Next.js - Porta 5002)
# ──────────────────────────────────────────────
echo ""
echo "[5/5] Checkout (5002)..."
export NEXT_PUBLIC_API_URL="http://localhost:5279"
cd "$ROOT_DIR/swiftpay-web-checkout"
nohup npx next dev --port 5002 > /tmp/swiftpay-checkout.log 2>&1 &
CHECKOUT_PID=$!
echo "  PID: $CHECKOUT_PID - Log: /tmp/swiftpay-checkout.log"

# ──────────────────────────────────────────────
echo ""
echo "========================================="
echo "  SwiftPay - Todos os servicos iniciados"
echo "========================================="
echo ""
echo "  Web:       http://localhost:5001"
echo "  Checkout:  http://localhost:5002"
echo "  API:       http://localhost:5279"
echo "  Payment:   http://localhost:5166"
echo "  MailHog:   http://localhost:8025"
echo "  MinIO:     http://localhost:9001"
echo "  RabbitMQ:  http://localhost:15672"
echo ""
echo "  Para parar: ./stop.sh"
echo "  Logs em: /tmp/swiftpay-*.log"
echo ""
