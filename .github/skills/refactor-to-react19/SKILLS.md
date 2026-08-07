---
name: Refactor to React 19
description: Converts legacy React code (useEffect, useState fetching) to React 19 Server Actions and Server Components.
---

# Skill: Legacy to React 19 Refactoring

Use this skill when the user asks to "refactor", "modernize", or "migrate" a component.

## Step-by-Step Migration Strategy

1.  **Analyze Data Fetching:**
    * IF the component fetches data on mount:
        * Extract the fetch logic to a standalone async function.
        * Convert the main component to `async` (Server Component).
        * Remove `useEffect` and `useState` related to data loading.

2.  **Analyze Interactivity:**
    * IF the component has `onClick`, `onChange`, or uses browser APIs:
        * Split the interactive parts into a smaller component.
        * Add `'use client'` ONLY to that smaller component.
        * Import the client component into the server parent.

3.  **Analyze Mutations (Forms):**
    * IF `onSubmit` handles data saving:
        * Create a `actions.ts` file with `'use server'`.
        * Move the mutation logic there.
        * Replace `onSubmit` with the `action` prop on the form.
        * Implement `useActionState` for loading/error handling.

4.  **Cleanup:**
    * Remove manual `useMemo`/`useCallback` (React Compiler handles this).
    * Ensure strict TypeScript typing for all props.

## Example Output Structure

```tsx
// actions.ts
'use server';
import { z } from 'zod';

export async function saveData(prevState: any, formData: FormData) {
  // validation and DB logic
}

// Page.tsx (Server Component)
import { ClientForm } from './ClientForm';

export default async function Page() {
  const data = await db.query(); // Direct fetch
  return <ClientForm initialData={data} />;
}