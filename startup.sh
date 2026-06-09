#!/bin/bash
# Startup script that runs the appropriate API based on API_TYPE env var

set -e

if [ "$API_TYPE" = "payment" ]; then
    echo "Starting Payment API..."
    exec dotnet /app/payment/Swiftpay.Api.Payment.dll
elif [ "$API_TYPE" = "gestao" ]; then
    echo "Starting Gestao API..."
    exec dotnet /app/gestao/Swiftpay.Api.Gestao.dll
else
    echo "Starting Gestao API (default)..."
    exec dotnet /app/gestao/Swiftpay.Api.Gestao.dll
fi
