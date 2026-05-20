---
description: "Use when editing product and image rules, security logging, and shared validation patterns."
applyTo: 'Endpoints/**/Products/**/*.cs, Endpoints/**/Upload/**/*.cs, Validators/**/*.cs, Filters/**/*.cs, Services/Internal/*SecurityLog*.cs'
---

## Imagens de Produtos e Variantes

Os produtos suportam até **6 imagens**, enquanto cada variante suporta **1 imagem**.

### Regras de Dados

- `Product.ImageUrls`: lista com até 6 URLs (armazenada como JSONB)
- `Product.ImageUrl`: imagem principal (primeira de `ImageUrls`)
- `Variant.ImageUrl`: URL única da variante
- Se `ImageUrls` não for informado, `ImageUrl` é usado como fallback

### Upload de Imagens

Para enviar imagens, use o endpoint de upload do merchant com a pasta de produtos:

```
POST /v1/merchant/upload
folder=Products
isPublic=true
```

### Boas Práticas

- Sempre enviar `ImageUrls` no create/update de produto
- Limitar a **6** imagens no frontend e validar URLs no backend
- Usar imagens **públicas** para garantir acesso no checkout

---

## Security Log

### Log com ISecurityLogService

Para registrar logs de segurança, use o `ISecurityLogService`:

```csharp
public sealed class MyEndpoint(
    ISecurityLogService securityLog
) : Endpoint<...>
{
    public override async Task HandleAsync(...)
    {
        // Log de segurança
        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.UserSignIn,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = "Login realizado com sucesso"
        });
    }
}
```

---

## Validação com FluentValidation

### Validador Básico

```csharp
public sealed class MyRequestValidator : Validator<MyRequest>
{
    public MyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(100).WithMessage("O nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("O email é obrigatório.")
            .EmailAddress().WithMessage("O email deve ser válido.");
    }
}
```

### Validadores de Paginação

```csharp
using safefy_api.Validators;

public sealed class MyValidator : Validator<MyRequest>
{
    public MyValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        // ou
        // this.AddPaginationRules(); // se implementar IPaginatedRequest
    }
}
```

---



