import { useMemo, useState } from "react";

// Always offered, even before any live data arrives.
export const POPULAR_TAGS = [
  { slug: "politics", label: "Politics" },
  { slug: "crypto", label: "Crypto" },
  { slug: "sports", label: "Sports" },
  { slug: "economy", label: "Economy" },
  { slug: "tech", label: "Tech" },
  { slug: "ai", label: "AI" },
  { slug: "geopolitics", label: "Geopolitics" },
  { slug: "elections", label: "Elections" },
  { slug: "pop-culture", label: "Culture" },
  { slug: "business", label: "Business" },
  { slug: "science", label: "Science" },
  { slug: "world", label: "World" },
];

export default function TagPicker({ available, selected, onChange }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const tags = useMemo(() => {
    const bySlug = new Map();
    for (const t of [...POPULAR_TAGS, ...available]) if (!bySlug.has(t.slug)) bySlug.set(t.slug, t);
    for (const t of selected) if (!bySlug.has(t.slug)) bySlug.set(t.slug, t);
    return [...bySlug.values()];
  }, [available, selected]);

  const q = query.trim().toLowerCase();
  const filtered = q ? tags.filter((t) => t.label.toLowerCase().includes(q)) : tags;
  const visible = showAll || q ? filtered : filtered.slice(0, 24);
  const isOn = (slug) => selected.some((t) => t.slug === slug);

  const toggle = (tag) =>
    onChange(isOn(tag.slug) ? selected.filter((t) => t.slug !== tag.slug) : [...selected, tag]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics…"
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 sm:w-64"
        />
        {selected.length > 0 && (
          <button className="text-sm font-medium text-ink-500 hover:text-ink-800" onClick={() => onChange([])}>
            Clear all ({selected.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((t) => {
          const on = isOn(t.slug);
          return (
            <button
              key={t.slug}
              onClick={() => toggle(t)}
              aria-pressed={on}
              className={`chip ${
                on
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
              }`}
            >
              {on ? "✓" : "+"} {t.label}
            </button>
          );
        })}
        {!q && filtered.length > 24 && (
          <button className="chip border-transparent text-brand-700" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `+${filtered.length - 24} more`}
          </button>
        )}
        {q && !filtered.length && <p className="text-sm text-ink-500">No topics match “{query}”.</p>}
      </div>
    </div>
  );
}
