export const SOURCE_OPTIONS = ["ChatGPT", "TikTok", "その他"] as const;

export type RecipeSource = (typeof SOURCE_OPTIONS)[number];

export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  source: RecipeSource;
  rating: number;
  memo: string;
};

export type RecipeInput = Omit<Recipe, "id">;
