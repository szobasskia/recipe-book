import type { Recipe, RecipeInput } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_WORKER_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8787";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const body = init?.body;

  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed");
  }

  return (await response.json()) as T;
}

export async function listRecipes(): Promise<Recipe[]> {
  const data = await fetchJson<{ recipes: Recipe[] }>("/recipes");
  return data.recipes;
}

export async function createRecipe(recipe: RecipeInput): Promise<void> {
  await fetchJson("/recipes", {
    method: "POST",
    body: JSON.stringify(recipe),
  });
}
