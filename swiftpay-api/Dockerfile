FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 5279

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG GITHUB_USER=dummy
ARG GITHUB_TOKEN=dummy

RUN dotnet nuget add source "https://nuget.pkg.github.com/SwiftPay/index.json" \
    --name github-swiftpay \
    --username $GITHUB_USER \
    --password $GITHUB_TOKEN \
    --store-password-in-clear-text

WORKDIR /src
COPY ["swiftpay-api/swiftpay-api.csproj", "swiftpay-api/"]
COPY ["swiftpay-api-core/swiftpay-api-core.csproj", "swiftpay-api-core/"]
RUN dotnet restore "swiftpay-api/swiftpay-api.csproj" --ignore-failed-sources
COPY ["swiftpay-api/", "swiftpay-api/"]
COPY ["swiftpay-api-core/", "swiftpay-api-core/"]
RUN rm -rf swiftpay-api/obj swiftpay-api/bin swiftpay-api-core/obj swiftpay-api-core/bin \
    && dotnet restore "swiftpay-api/swiftpay-api.csproj" --ignore-failed-sources

FROM build AS publish
RUN dotnet publish "swiftpay-api/swiftpay-api.csproj" -c Release --no-restore -o /app/publish /p:UseAppHost=false /p:GeneratePackageOnBuild=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5279
ENTRYPOINT ["dotnet", "swiftpay-api.dll"]