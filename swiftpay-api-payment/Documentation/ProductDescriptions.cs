namespace swiftpay_api_payment.Documentation;

public static partial class EndpointDescriptions
{
    public static class Products
    {
        public const string List = @"
Retorna uma lista paginada de todos os produtos da sua organização com suporte a filtros.

### 📋 Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|----------|
| `page` | int | 1 | Página atual |
| `pageSize` | int | 20 | Itens por página (máx: 100) |
| `status` | string | - | Filtrar por status (`Active`, `Inactive`, `Archived`) |
| `type` | string | - | Filtrar por tipo (`Product`, `Service`) |
| `categoryId` | guid | - | Filtrar por categoria |
| `search` | string | - | Buscar por nome ou descrição |
| `externalId` | string | - | Filtrar por ID externo exato |
| `startDate` | datetime | - | Data inicial de criação (ISO 8601) |
| `endDate` | datetime | - | Data final de criação (ISO 8601) |

### 📊 Status Disponíveis

| Status | Descrição |
|--------|----------|
| `Active` | ✅ Produto ativo, disponível para vendas |
| `Inactive` | ❌ Produto inativo |
| `Archived` | 📦 Produto arquivado |

### 💰 Preços

Os preços são retornados em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|-------------|
| R$ 1,00    | 100         |
| R$ 10,50   | 1050        |
| R$ 100,00  | 10000       |
";

        public const string Get = @"
Retorna os dados completos de um produto específico, incluindo suas variantes e categorias.

### 📊 Status do Produto

| Status | Descrição |
|--------|----------|
| `Active` | ✅ Produto ativo |
| `Inactive` | ❌ Produto inativo |
| `Archived` | 📦 Produto arquivado |

### 📦 Campos Retornados

- `id` - Identificador único do produto
- `externalId` - Seu identificador interno (se informado na criação)
- `name` - Nome do produto
- `description` - Descrição detalhada
- `price` - Preço em centavos (pode ser nulo)
- `imageUrl` - URL da imagem principal
- `type` - Tipo: `Product` ou `Service`
- `status` - Status atual
- `categories` - Lista de categorias associadas
- `variants` - Lista de variantes do produto
- `createdAt` - Data de criação
";
    }
}
