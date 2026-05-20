FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5166

RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG configuration=Release
WORKDIR /src

COPY ["safefy-api-payment/safefy-api-payment.csproj", "safefy-api-payment/"]
COPY ["safefy-api-core/safefy-api-core.csproj", "safefy-api-core/"]
RUN dotnet restore "safefy-api-payment/safefy-api-payment.csproj" --ignore-failed-sources

COPY ["safefy-api-payment/", "safefy-api-payment/"]
COPY ["safefy-api-core/", "safefy-api-core/"]
RUN rm -rf safefy-api-payment/obj safefy-api-payment/bin safefy-api-core/obj safefy-api-core/bin \
        && dotnet restore "safefy-api-payment/safefy-api-payment.csproj" --ignore-failed-sources

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "safefy-api-payment/safefy-api-payment.csproj" -c $configuration --no-restore -o /app/publish /p:UseAppHost=false /p:GeneratePackageOnBuild=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5166
ENTRYPOINT ["dotnet", "safefy-api-payment.dll"]
