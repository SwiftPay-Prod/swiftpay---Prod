FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5279

RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG GITHUB_USER
ARG GITHUB_TOKEN

RUN dotnet nuget add source "https://nuget.pkg.github.com/Safefy-Pay/index.json" \
    --name github-swiftpay \
    --username $GITHUB_USER \
    --password $GITHUB_TOKEN \
    --store-password-in-clear-text

WORKDIR /src
COPY ["swiftpay-api.csproj", "./"]
RUN dotnet restore "swiftpay-api.csproj"
COPY . .

# Stage publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:GeneratePackageOnBuild=false

# Stage final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5279
ENTRYPOINT ["dotnet", "swiftpay-api.dll"]