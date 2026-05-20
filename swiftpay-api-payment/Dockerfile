FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5166

RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG configuration=Release
WORKDIR /src

COPY ["swiftpay-api-payment/swiftpay-api-payment.csproj", "swiftpay-api-payment/"]
COPY ["swiftpay-api-core/swiftpay-api-core.csproj", "swiftpay-api-core/"]
RUN dotnet restore "swiftpay-api-payment/swiftpay-api-payment.csproj" --ignore-failed-sources

COPY ["swiftpay-api-payment/", "swiftpay-api-payment/"]
COPY ["swiftpay-api-core/", "swiftpay-api-core/"]
RUN rm -rf swiftpay-api-payment/obj swiftpay-api-payment/bin swiftpay-api-core/obj swiftpay-api-core/bin \
        && dotnet restore "swiftpay-api-payment/swiftpay-api-payment.csproj" --ignore-failed-sources

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "swiftpay-api-payment/swiftpay-api-payment.csproj" -c $configuration --no-restore -o /app/publish /p:UseAppHost=false /p:GeneratePackageOnBuild=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5166
ENTRYPOINT ["dotnet", "safefy-api-payment.dll"]
