# GitHub Copilot Instructions - React 19 & Next.js 15

You are an expert in React 19 and Next.js 15 (App Router). Your goal is to enforce modern architecture, prevent legacy patterns, and ensure maintainable, DRY code.

## 🚫 CRITICAL ANTI-PATTERNS (Never Generate)

1.  **No `useEffect` for Data Fetching:**
    * *Bad:* Fetching inside `useEffect` causes waterfalls.
    * *Good:* Use **Server Components** with `async/await` directly. Use `Suspense` for streaming.

2.  **No Manual Memoization (React Compiler):**
    * *Bad:* `useMemo` or `useCallback` for every prop.
    * *Good:* Assume **React Compiler** is active. Only memoize if strictly necessary for referential identity in external libs.

3.  **No "Client-Side First":**
    * *Bad:* Putting `'use client'` at the top of page/layout files.
    * *Good:* Push `'use client'` down to the "leaves" (interactive buttons/inputs). Keep layouts and pages as Server Components.

4.  **No API Routes for Mutations:**
    * *Bad:* Creating `app/api/route.ts` just to handle a form submit.
    * *Good:* Use **Server Actions** (`'use server'`) invoked directly from `<form>` or event handlers.

5.  **No Uncontrolled Auto-Save (Rate Limiting):**
    * *Bad:* Using `useDeferredValue` alone to trigger server saves. It optimizes rendering, not network requests.
    * *Good:* Always use a **Debounce** pattern (custom hook like `useDebounce`) with a fixed delay (e.g., 500-1000ms) before triggering a Server Action to protect the database.

6.  **No Repetitive UI (DRY Violation):**
    * *Bad:* Hardcoding multiple similar cards/rows (e.g., 5+ integrations like Facebook, Google, TikTok) with copy-pasted JSX.
    * *Good:* Use a **Config-Driven UI** pattern. Create a `const CONFIG = [...]` array and map over a single generic component (e.g., `<IntegrationCard config={item} />`).

## ✅ MODERN SYNTAX PREFERENCES

* **Forms:** Use `useActionState` (not `useFormState`) for handling form feedback.
* **Async UI:** Use the `use()` hook to unwrap promises in Client Components conditionally.
* **Navigation:** Use `<Link>` with `prefetch={true}` (default) instead of `router.push`.
* **Params:** In Next.js 15, `params` and `searchParams` are Promises. Always `await` them: `const { slug } = await params;`.
* **Auto-Save Logic:** Prefer `useEffect` watching a *debounced* value, handling a `cancelled` flag cleanup to prevent race conditions.

## 🎨 HEROUI FORM COMPONENT VARIANTS
* **All form components must use `variant="secondary"`** — this applies to `Input`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `NumberField`, `SearchField`, `DateField`, `TimeField`, `ColorField`, `Slider`, and any other HeroUI form/input component.
* *Bad:* `<Input placeholder="..." />` or `<Select>` without a variant.
* *Good:* `<Input variant="secondary" placeholder="..." />`, `<Select variant="secondary">`, `<Checkbox variant="secondary">`.
* **Never use native HTML form elements** (`<input>`, `<select>`, `<textarea>`, `<input type="checkbox">`, `<input type="radio">`) — always use the HeroUI equivalent with `variant="secondary"`.

## 🔘 HEROUI SWITCH COMPOUND PATTERN (Required)
* **Never use self-closing `<Switch />`** — HeroUI v3 Switch requires inner compound elements to render the track and thumb.
* *Bad:* `<Switch isSelected={val} onChange={fn} />`
* *Good:*
  ```tsx
  <Switch isSelected={val} onChange={fn}>
    <Switch.Control>
      <Switch.Thumb />
    </Switch.Control>
  </Switch>
  ```
* The label text must be placed **outside** the Switch, as a sibling (e.g., in a wrapping `<div className="flex items-center gap-2">`), not nested inside unless using the full label-inside pattern where `<Switch.Control>` and the label div are siblings inside the Switch's children.
* The `onChange` prop receives `(checked: boolean) => void` — use this, not `onValueChange`.

## 🛡️ SECURITY & TYPES
* Validate all Server Action inputs with Zod.
* Never pass sensitive data (secrets) to Client Components as props.
* Ensure STRICT typing for all component props.