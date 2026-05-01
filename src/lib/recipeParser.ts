type ParsedRecipeText = {
  title: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  memo: string;
};

const FIELDS = ["料理名", "食材", "手順", "タグ", "メモ"] as const;

function getFieldBlock(text: string, field: (typeof FIELDS)[number]): string {
  const escaped = FIELDS.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const nextFields = escaped.filter((item) => item !== field);
  const pattern = new RegExp(
    `【${field}】\\s*([\\s\\S]*?)(?=\\n【(?:${nextFields.join("|")})】|$)`,
    ""
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSteps(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

export function parseRecipeText(text: string): ParsedRecipeText {
  return {
    title: getFieldBlock(text, "料理名"),
    ingredients: splitCommaList(getFieldBlock(text, "食材")),
    steps: parseSteps(getFieldBlock(text, "手順")),
    tags: splitCommaList(getFieldBlock(text, "タグ")),
    memo: getFieldBlock(text, "メモ"),
  };
}
