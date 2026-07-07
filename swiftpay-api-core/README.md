# swiftpay-api-core

Biblioteca compartilhada de entidades, modelos e serviços para o ecossistema SWIFTPAY API.

## Gerando o Pacote

```powershell
cd swiftpay-api-core
dotnet build -c Release
dotnet pack -c Release -o ./nupkg --no-build
```

O pacote será gerado em `./nupkg/swiftpay-api-core.{version}.nupkg`.

## Atualizando nos Projetos

Após gerar o pacote, copie para os projetos consumidores:

```powershell
Copy-Item ./nupkg/*.nupkg ../swiftpay-api/nupkg/ -Force
Copy-Item ./nupkg/*.nupkg ../swiftpay-api-payment/nupkg/ -Force
```

Para desenvolvimento local, limpe o cache e restaure:

```powershell
dotnet nuget locals all --clear
cd ../swiftpay-api && dotnet restore
cd ../swiftpay-api-payment && dotnet restore
```

Para Docker, rebuild das imagens:

```powershell
cd ../swiftpay-api && docker build --no-cache -t swiftpayapi:latest .
cd ../swiftpay-api-payment && docker build --no-cache -t swiftpayapipayment:latest .
```

## Versionamento

Para evitar problemas de cache, incremente a versão no `swiftpay-api-core.csproj`:

```xml
<Version>1.1.0</Version>
```

E atualize a referência nos projetos consumidores:

```xml
<PackageReference Include="swiftpay-api-core" Version="1.1.0" />
```

### Criando Tag no Git

Após atualizar a versão e fazer commit das alterações:

```bash
git tag -a v1.1.0 -m "v1.1.0 - Descrição da versão"
git push origin main
git push origin v1.1.0
```

| Tipo de Alteração | Versão | Exemplo |
|-------------------|--------|---------|
| Breaking changes | MAJOR (2.0.0) | Remover campo, mudar tipo |
| Novas funcionalidades | MINOR (1.1.0) | Adicionar campos, novos enums |
| Bug fixes | PATCH (1.0.1) | Corrigir validação |

## Estrutura

```
swiftpay-api-core/
├── Constants/        # IDs fixos do sistema
├── Database/         # LogDbContext e entidades de log
├── Interfaces/       # Contratos de serviços compartilhados
├── Models/           # Entidades, enums e configurações
├── Services/         # Implementações de serviços
└── nupkg/            # Pacotes NuGet gerados
```

## Projetos que utilizam

- **swiftpay-api** - API principal (gestão de merchants, usuários, admin)
- **swiftpay-api-payment** - API de pagamentos (cobranças PIX, webhooks)
