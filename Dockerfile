FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj src/Swiftpay.Api.Core/
COPY src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj src/Swiftpay.Api.Gestao/
COPY src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj src/Swiftpay.Api.Payment/

RUN dotnet restore src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj && \
    dotnet restore src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj

COPY . .
RUN dotnet publish src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj -c Release -o /app/gestao && \
    dotnet publish src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj -c Release -o /app/payment

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
