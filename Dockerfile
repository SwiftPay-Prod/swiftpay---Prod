FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj src/Swiftpay.Api.Core/
COPY src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj src/Swiftpay.Api.Gestao/
COPY src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj src/Swiftpay.Api.Payment/

RUN dotnet restore src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj && \
    dotnet restore src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj

COPY . .
RUN dotnet publish src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj -c Release -o /app/gestao --self-contained && \
    dotnet publish src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj -c Release -o /app/payment --self-contained

FROM mcr.microsoft.com/dotnet/runtime:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .
# Each API runs as separate process with its own entry point
