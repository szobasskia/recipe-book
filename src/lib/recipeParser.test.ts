import { describe, expect, it } from "vitest";
import { parseRecipeText } from "./recipeParser";

describe("parseRecipeText", () => {
  it("定義フォーマットをパースできる", () => {
    const input = `【料理名】親子丼
【食材】鶏もも肉, 玉ねぎ, 卵
【手順】
1. 玉ねぎを切る
2. 鶏肉を焼く
3. 卵でとじる
【タグ】和食, 丼
【メモ】甘めの味付けが好み`;

    const parsed = parseRecipeText(input);

    expect(parsed.title).toBe("親子丼");
    expect(parsed.ingredients).toEqual(["鶏もも肉", "玉ねぎ", "卵"]);
    expect(parsed.steps).toEqual(["玉ねぎを切る", "鶏肉を焼く", "卵でとじる"]);
    expect(parsed.tags).toEqual(["和食", "丼"]);
    expect(parsed.memo).toBe("甘めの味付けが好み");
  });

  it("手順の番号記法がなくても改行で解釈する", () => {
    const input = `【料理名】味噌汁
【食材】豆腐, わかめ
【手順】
出汁を取る
味噌を溶く
豆腐とわかめを入れる
【タグ】汁物`;

    const parsed = parseRecipeText(input);

    expect(parsed.steps).toEqual([
      "出汁を取る",
      "味噌を溶く",
      "豆腐とわかめを入れる",
    ]);
    expect(parsed.memo).toBe("");
  });
});
