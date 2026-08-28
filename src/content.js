import site from "../content/site.json";

const focusModules = import.meta.glob("../content/focus/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const noteModules = import.meta.glob("../content/notes/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const postModules = import.meta.glob("../content/posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(value) {
  const clean = unquote(value);
  if (clean === "true") return true;
  if (clean === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean);
  if (clean.startsWith("[") && clean.endsWith("]")) {
    return clean
      .slice(1, -1)
      .split(",")
      .map((item) => unquote(item))
      .filter(Boolean);
  }
  return clean;
}

function parseDocument(raw, path) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const data = {};
  let body = raw;

  if (match) {
    for (const line of match[1].split("\n")) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const separator = line.indexOf(":");
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1);
      data[key] = parseValue(value);
    }
    body = match[2].trim();
  }

  const filename = path.split("/").pop() || "entry.md";
  return {
    ...data,
    body,
    slug: filename.replace(/\.md$/, ""),
  };
}

function parseCollection(modules) {
  return Object.entries(modules)
    .map(([path, raw]) => parseDocument(raw, path))
    .filter((entry) => entry.published !== false);
}

export const siteConfig = site;
export const focusItems = parseCollection(focusModules).sort(
  (a, b) => Number(a.rank || 999) - Number(b.rank || 999),
);
export const notes = parseCollection(noteModules).sort((a, b) =>
  String(b.date || "").localeCompare(String(a.date || "")),
);
export const posts = parseCollection(postModules).sort((a, b) =>
  String(b.date || "").localeCompare(String(a.date || "")),
);

export function formatDate(value, compact = false) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: compact ? "short" : "long",
    year: "numeric",
  }).format(parsed);
}
