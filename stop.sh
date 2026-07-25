#!/usr/bin/env bash
set -e

echo "Parando servicos SwiftPay..."

# Mata processos das aplicacoes
pkill -f "swiftpay-api" 2>/dev/null || true
pkill -f "swiftpay-api-payment" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Para containers Docker (mantem dados nos volumes)
cd "$(dirname "$0")/swiftpay-api"
docker compose -f docker-compose.development.yaml down 2>/dev/null || true

echo ""
echo "Servicos parados."
echo "Para remover os dados: docker compose -f swiftpay-api/docker-compose.development.yaml down -v"