import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const repository = process.env.GITHUB_REPOSITORY || "bpmwl/onefocus";
const [owner, repo] = repository.split("/");
const defaultUrl =
  repo === `${owner}.github.io`
    ? `https://${owner}.github.io`
    : `https://${owner}.github.io/${repo}`;
const siteUrl = (process.env.SITE_URL || defaultUrl).replace(/\/$/, "");

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readCollection(collection, kind) {
  const directory = path.join(root, "content", collection);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));
  const entries = [];

  for (const file of files) {
    const raw = await readFile(path.join(directory, file), "utf8");
    const parsed = matter(raw);
    if (parsed.data.published === false) continue;
    entries.push({
      ...parsed.data,
      kind,
      slug: file.replace(/\.md$/, ""),
    });
  }

  return entries;
}

const site = JSON.parse(await readFile(path.join(root, "content/site.json"), "utf8"));
const entries = [
  ...(await readCollection("posts", "posts")),
  ...(await readCollection("notes", "notes")),
].sort((a, b) => String(b.date).localeCompare(String(a.date)));

const items = entries
  .map((entry) => {
    const description = entry.description || entry.summary || "";
    const link = `${siteUrl}/${entry.kind}/${entry.slug}`;
    const pubDate = new Date(`${entry.date}T12:00:00Z`).toUTCString();
    return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
  })
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(site.description)}</description>
${items}
  </channel>
</rss>
`;

await mkdir(path.join(root, "public"), { recursive: true });
await writeFile(path.join(root, "public/feed.xml"), rss);
await writeFile(
  path.join(root, "public/robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
);

const routes = [
  "",
  "notes",
  "posts",
  ...entries.map((entry) => `${entry.kind}/${entry.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${escapeXml(`${siteUrl}/${route}`)}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(path.join(root, "public/sitemap.xml"), sitemap);
