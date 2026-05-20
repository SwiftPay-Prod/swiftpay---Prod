# SWIFTPAY Web Checkout

Checkout multi-template com resolucao dinamica por configuracao do checkout retornada pela API.

## Objetivo

- Separar runtime de template da camada de rota.
- Permitir plugar novos templates sem alterar as paginas principais.
- Compartilhar apenas logica cross-template (mascaras, parse, tipos, actions).
- Manter design e fluxo exclusivos dentro de cada template.

## Arquitetura

### Runtime de templates

`core/checkout` concentra a orquestracao:

- `application/load-checkout-page-data.ts`: carrega checkout por codigo recebido na URL.
- `metadata/build-checkout-metadata.ts`: gera SEO/OG/Twitter de forma unica.
- `runtime/templates/*`: contrato, registro e resolucao do template.
- `runtime/render-checkout-runtime.tsx`: renderiza template resolvido com `TrackingProvider`.

### Rotas

- `app/[checkoutId]/page.tsx`: rota principal (production).
- `app/sandbox/[checkoutId]/page.tsx`: rota de sandbox.

Ambas usam o mesmo pipeline:

1. Carregar checkout
2. Gerar metadata
3. Resolver template pelo `checkout.template.code`
4. Renderizar runtime

### Templates como micro-projetos

Cada template fica isolado em `templates/<template-name>`:

- `module.tsx`: adaptador do template para o runtime global.
- `index.tsx`: entrypoint do template.
- `views/`, `sections/`, `components/`: fluxo e UI especificos do template.
- `theme.css`, `parse.tsx`: identidade visual local.

### Compartilhado entre templates

Use apenas para regras de dominio e utilidades:

- `types/`
- `actions/`
- `hooks/`
- `parse/`
- `utils/`
- `shared/masks/`

## Estrutura principal

```txt
swiftpay-web-checkout/
	app/
		[checkoutId]/
		sandbox/[checkoutId]/
		pay/[token]/
	core/
		checkout/
			application/
			metadata/
			runtime/
	templates/
		hero-pro/
			module.tsx
			index.tsx
			components/
			sections/
			views/
			theme.css
	shared/
		masks/
	actions/
	hooks/
	parse/
	types/
	utils/
```

## Como adicionar novo template

1. Criar `templates/<novo-template>/module.tsx` e `index.tsx`.
2. Implementar UI/fluxo apenas dentro desse template.
3. Registrar no `core/checkout/runtime/templates/registry.ts`.
4. Garantir que a API retorna `checkout.template.code` correspondente.

Nenhuma alteracao nas rotas `app/[checkoutId]` ou `app/sandbox/[checkoutId]` deve ser necessaria.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
