# safefy-api-core

Biblioteca compartilhada de entidades, modelos e serviços para o ecossistema Safefy API.

## Gerando o Pacote

```powershell
cd safefy-api-core
dotnet build -c Release
dotnet pack -c Release -o ./nupkg --no-build
```

O pacote será gerado em `./nupkg/safefy-api-core.{version}.nupkg`.

## Atualizando nos Projetos

Após gerar o pacote, copie para os projetos consumidores:

```powershell
Copy-Item ./nupkg/*.nupkg ../safefy-api/nupkg/ -Force
Copy-Item ./nupkg/*.nupkg ../safefy-api-payment/nupkg/ -Force
```

Para desenvolvimento local, limpe o cache e restaure:

```powershell
dotnet nuget locals all --clear
cd ../safefy-api && dotnet restore
cd ../safefy-api-payment && dotnet restore
```

Para Docker, rebuild das imagens:

```powershell
cd ../safefy-api && docker build --no-cache -t safefyapi:latest .
cd ../safefy-api-payment && docker build --no-cache -t safefyapipayment:latest .
```

## Versionamento

Para evitar problemas de cache, incremente a versão no `safefy-api-core.csproj`:

```xml
<Version>1.1.0</Version>
```

E atualize a referência nos projetos consumidores:

```xml
<PackageReference Include="safefy-api-core" Version="1.1.0" />
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
safefy-api-core/
├── Constants/        # IDs fixos do sistema
├── Database/         # LogDbContext e entidades de log
├── Interfaces/       # Contratos de serviços compartilhados
├── Models/           # Entidades, enums e configurações
├── Services/         # Implementações de serviços
└── nupkg/            # Pacotes NuGet gerados
```

## Projetos que utilizam

- **safefy-api** - API principal (gestão de merchants, usuários, admin)
- **safefy-api-payment** - API de pagamentos (cobranças PIX, webhooks)
