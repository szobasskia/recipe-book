import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import { createRecipe, listRecipes } from "./lib/api";
import { parseRecipeText } from "./lib/recipeParser";
import { SOURCE_OPTIONS, type Recipe, type RecipeInput, type RecipeSource } from "./types";

const SOURCE_HINTS: Record<RecipeSource, string> = {
  ChatGPT: "ChatGPTの出力をそのまま貼り付け",
  TikTok: "動画説明欄・コメントから整形して貼り付け",
  その他: "メモアプリやWebの内容を貼り付け",
};

function stars(value: number): string {
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecipes(await listRecipes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初回表示時に一覧を取得
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function handleCreate(payload: RecipeInput) {
    await createRecipe(payload);
    await refresh();
    setIsSheetOpen(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Recipe Book</h1>
        <button type="button" onClick={() => setIsSheetOpen(true)}>
          レシピ登録
        </button>
      </header>
      <main>
        {error && <p className="error-text">{error}</p>}
        {loading && <p>読み込み中...</p>}
        <Routes>
          <Route path="/" element={<ListPage recipes={recipes} />} />
          <Route path="/recipe/:id" element={<DetailPage recipes={recipes} />} />
        </Routes>
      </main>
      {isSheetOpen && (
        <AddRecipeSheet onClose={() => setIsSheetOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}

function ListPage({ recipes }: { recipes: Recipe[] }) {
  const [keyword, setKeyword] = useState("");
  const [activeTag, setActiveTag] = useState("すべて");

  const tags = useMemo(() => {
    const all = new Set<string>();
    recipes.forEach((recipe) => recipe.tags.forEach((tag) => all.add(tag)));
    return ["すべて", ...Array.from(all)];
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const keywordHit =
        !q ||
        recipe.title.toLowerCase().includes(q) ||
        recipe.ingredients.join(",").toLowerCase().includes(q);
      const tagHit = activeTag === "すべて" || recipe.tags.includes(activeTag);
      return keywordHit && tagHit;
    });
  }, [activeTag, keyword, recipes]);

  return (
    <>
      <input
        className="search-input"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="料理名・食材で検索"
      />
      <div className="tag-row">
        {tags.map((tag) => (
          <button
            type="button"
            key={tag}
            className={tag === activeTag ? "tag active" : "tag"}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="grid">
        {filtered.map((recipe) => (
          <Link className="card" key={recipe.id} to={`/recipe/${recipe.id}`}>
            <div className="card-header">
              <h2>{recipe.title}</h2>
              <span className="badge">{recipe.source}</span>
            </div>
            <p className="small">{recipe.ingredients.join(" / ")}</p>
            <p>{stars(recipe.rating)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function DetailPage({ recipes }: { recipes: Recipe[] }) {
  const params = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find((item) => item.id === params.id);

  if (!recipe) {
    return (
      <section>
        <p>レシピが見つかりません。</p>
        <button type="button" onClick={() => navigate("/")}>
          一覧へ戻る
        </button>
      </section>
    );
  }

  return (
    <article className="detail">
      <button type="button" onClick={() => navigate("/")}>
        一覧へ戻る
      </button>
      <h2>{recipe.title}</h2>
      <p>
        {recipe.source} / {stars(recipe.rating)}
      </p>
      <div className="chip-row">
        {recipe.ingredients.map((ingredient) => (
          <span className="chip" key={ingredient}>
            {ingredient}
          </span>
        ))}
      </div>
      <ol>
        {recipe.steps.map((step, index) => (
          <li key={`${step}-${index}`}>{step}</li>
        ))}
      </ol>
      {recipe.memo && <p className="memo">{recipe.memo}</p>}
    </article>
  );
}

function AddRecipeSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (recipe: RecipeInput) => Promise<void>;
}) {
  const [source, setSource] = useState<RecipeSource>("ChatGPT");
  const [rawText, setRawText] = useState("");
  const [rating, setRating] = useState(3);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const parsed = parseRecipeText(rawText);
    if (!parsed.title || parsed.ingredients.length === 0 || parsed.steps.length === 0) {
      setError("料理名・食材・手順は必須です。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...parsed,
        source,
        rating,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="tab-row">
          {SOURCE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={option === source ? "tab active" : "tab"}
              onClick={() => setSource(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="small">{SOURCE_HINTS[source]}</p>
        <textarea
          rows={10}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="【料理名】... の形式で貼り付け"
        />
        <div className="star-picker">
          {[1, 2, 3, 4, 5].map((value) => (
            <button type="button" key={value} onClick={() => setRating(value)}>
              {value <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="button" disabled={saving} onClick={submit}>
            保存
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
