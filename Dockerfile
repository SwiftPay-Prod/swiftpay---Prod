FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/Swiftpay.Domain/Swiftpay.Domain.csproj src/Swiftpay.Domain/
COPY src/Swiftpay.Application/Swiftpay.Application.csproj src/Swiftpay.Application/
COPY src/Swiftpay.Infrastructure/Swiftpay.Infrastructure.csproj src/Swiftpay.Infrastructure/
COPY src/Swiftpay.WebApi/Swiftpay.WebApi.csproj src/Swiftpay.WebApi/
RUN dotnet restore src/Swiftpay.WebApi/Swiftpay.WebApi.csproj

COPY . .
RUN dotnet publish src/Swiftpay.WebApi/Swiftpay.WebApi.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Swiftpay.WebApi.dll"]
