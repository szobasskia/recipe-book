interface Env {
  NOTION_TOKEN: string;
  NOTION_DATABASE_ID: string;
  NOTION_VERSION: string;
}

type RecipePayload = {
  title: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  source: "ChatGPT" | "TikTok" | "その他";
  rating: number;
  memo: string;
};

type NotionText = { plain_text?: string };
type NotionProperty = {
  title?: NotionText[];
  rich_text?: NotionText[];
  multi_select?: { name: string }[];
  select?: { name: string };
  number?: number;
};
type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}

function recipeFromPage(page: NotionPage) {
  const props = page.properties;
  return {
    id: page.id,
    title: props["料理名"]?.title?.[0]?.plain_text ?? "",
    ingredients: (props["食材"]?.rich_text?.[0]?.plain_text ?? "")
      .split(",")
      .map((item: string) => item.trim())
      .filter(Boolean),
    steps: (props["手順"]?.rich_text?.[0]?.plain_text ?? "")
      .split("\n")
      .map((item: string) => item.trim())
      .filter(Boolean),
    tags: (props["タグ"]?.multi_select ?? []).map((tag: { name: string }) => tag.name),
    source: props["ソース"]?.select?.name ?? "その他",
    rating: props["また作りたい度"]?.number ?? 3,
    memo: props["メモ"]?.rich_text?.[0]?.plain_text ?? "",
  };
}

async function notionRequest(
  env: Env,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": env.NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return jsonResponse({}, 204);
    }

    if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
      return jsonResponse({ error: "Missing env vars for Notion" }, 500);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/recipes" && request.method === "GET") {
      const response = await notionRequest(env, `/databases/${env.NOTION_DATABASE_ID}/query`, {
        method: "POST",
        body: JSON.stringify({
          sorts: [{ property: "また作りたい度", direction: "descending" }],
        }),
      });

      if (!response.ok) {
        return jsonResponse({ error: await response.text() }, 500);
      }

      const data = (await response.json()) as { results: NotionPage[] };
      return jsonResponse({ recipes: data.results.map(recipeFromPage) });
    }

    if (pathname === "/recipes" && request.method === "POST") {
      const payload = (await request.json()) as RecipePayload;
      const response = await notionRequest(env, "/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: env.NOTION_DATABASE_ID },
          properties: {
            料理名: { title: [{ text: { content: payload.title } }] },
            食材: { rich_text: [{ text: { content: payload.ingredients.join(", ") } }] },
            手順: { rich_text: [{ text: { content: payload.steps.join("\n") } }] },
            タグ: {
              multi_select: payload.tags.map((tag) => ({
                name: tag,
              })),
            },
            ソース: { select: { name: payload.source } },
            また作りたい度: { number: payload.rating },
            メモ: { rich_text: [{ text: { content: payload.memo } }] },
          },
        }),
      });

      if (!response.ok) {
        return jsonResponse({ error: await response.text() }, 500);
      }

      return jsonResponse({ ok: true }, 201);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
