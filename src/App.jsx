import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  CaretRight,
  GithubLogo,
  Minus,
  Moon,
  NotePencil,
  RssSimple,
  Sun,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  focusItems,
  formatDate,
  notes,
  posts,
  siteConfig,
} from "./content.js";

const BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function hrefFor(route) {
  const [pathname, hash] = route.split("#");
  const normalized = pathname === "/" ? "" : pathname.replace(/^\//, "");
  return `${BASE}${normalized}${hash ? `#${hash}` : ""}`;
}

function currentRoute() {
  let pathname = window.location.pathname;
  if (BASE !== "/" && pathname.startsWith(BASE)) {
    pathname = `/${pathname.slice(BASE.length)}`;
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return pathname.replace(/\/$/, "") || "/";
}

function InternalLink({ to, children, onNavigate, ...props }) {
  function handleClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", hrefFor(to));
    onNavigate();
    const [, hash] = to.split("#");
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  return (
    <a href={hrefFor(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function ThemeSwitch({ theme, onChange }) {
  return (
    <div className="theme-switch" role="group" aria-label="Color theme">
      <button
        className={theme === "light" ? "is-active" : ""}
        type="button"
        aria-label="Use light theme"
        aria-pressed={theme === "light"}
        onClick={() => onChange("light")}
      >
        <Sun size={19} weight="regular" aria-hidden="true" />
      </button>
      <span aria-hidden="true" />
      <button
        className={theme === "dark" ? "is-active" : ""}
        type="button"
        aria-label="Use dark theme"
        aria-pressed={theme === "dark"}
        onClick={() => onChange("dark")}
      >
        <Moon size={18} weight="fill" aria-hidden="true" />
      </button>
    </div>
  );
}

function Sidebar({ route, onNavigate }) {
  const isHome = route === "/" || route.startsWith("/focus/");
  const isNotes = route === "/notes" || route.startsWith("/notes/");
  const isPosts = route === "/posts" || route.startsWith("/posts/");

  return (
    <aside className="sidebar">
      <div>
        <InternalLink className="brand" to="/" onNavigate={onNavigate}>
          <strong>{siteConfig.title}</strong>
          <span>{siteConfig.subtitle}</span>
        </InternalLink>

        <a
          className="github-link"
          href={siteConfig.githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          {siteConfig.githubLabel}
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          <InternalLink
            className={isHome ? "is-active" : ""}
            to="/#focus"
            onNavigate={onNavigate}
          >
            <CaretRight size={15} weight="bold" aria-hidden="true" />
            focus
          </InternalLink>
          <InternalLink
            className={isNotes ? "is-active" : ""}
            to="/notes"
            onNavigate={onNavigate}
          >
            <Minus size={15} aria-hidden="true" />
            notes
          </InternalLink>
          <InternalLink
            className={isPosts ? "is-active" : ""}
            to="/posts"
            onNavigate={onNavigate}
          >
            <Minus size={15} aria-hidden="true" />
            posts
          </InternalLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <a href={`${BASE}feed.xml`}>
          <RssSimple size={16} aria-hidden="true" />
          RSS
        </a>
        <InternalLink to="/admin" onNavigate={onNavigate}>
          <NotePencil size={16} aria-hidden="true" />
          Admin
        </InternalLink>
      </div>
    </aside>
  );
}

function FocusTable({ onNavigate }) {
  return (
    <section className="focus-section" id="focus" aria-labelledby="focus-title">
      <div className="section-heading">
        <h2 id="focus-title">IN FOCUS</h2>
        <span>{focusItems.length.toString().padStart(2, "0")} entries</span>
      </div>

      {focusItems.length ? (
        <div className="focus-table">
          <div className="focus-table__head" aria-hidden="true">
            <span>#</span>
            <span>MODEL</span>
            <span>WHY NOW</span>
            <span>STATUS</span>
            <span>UPDATED</span>
          </div>
          {focusItems.map((item) => (
            <InternalLink
              className="focus-row"
              key={item.slug}
              to={`/focus/${item.slug}`}
              onNavigate={onNavigate}
              aria-label={`${item.title}: ${item.why}`}
            >
              <strong className="focus-row__rank" data-label="#">
                {String(item.rank).padStart(2, "0")}
              </strong>
              <span className="focus-row__title" data-label="MODEL">
                {item.title}
              </span>
              <span className="focus-row__why" data-label="WHY NOW">
                {item.why}
              </span>
              <span
                className={`focus-row__status status-${String(item.status).toLowerCase()}`}
                data-label="STATUS"
              >
                {item.status}
              </span>
              <span className="focus-row__date" data-label="UPDATED">
                {formatDate(item.updated, true)}
              </span>
              <ArrowRight
                className="focus-row__arrow"
                size={18}
                aria-hidden="true"
              />
            </InternalLink>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your focus list is empty."
          text="Open Admin to publish the first model, tool, or idea."
          onNavigate={onNavigate}
        />
      )}
    </section>
  );
}

function FeedColumn({ title, entries, type, onNavigate }) {
  const isNote = type === "notes";
  const visible = entries.slice(0, 2);

  return (
    <section className="feed-column">
      <h2>{title}</h2>
      <div className="feed-list">
        {visible.map((entry) => (
          <InternalLink
            className="feed-item"
            key={entry.slug}
            to={`/${type}/${entry.slug}`}
            onNavigate={onNavigate}
          >
            <span>{entry.title}</span>
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          </InternalLink>
        ))}
      </div>
      <InternalLink className="text-arrow" to={`/${type}`} onNavigate={onNavigate}>
        All {isNote ? "notes" : "posts"}
        <ArrowRight size={17} aria-hidden="true" />
      </InternalLink>
    </section>
  );
}

function HomePage({ onNavigate }) {
  return (
    <>
      <header className="intro">
        <p>{siteConfig.description}</p>
      </header>
      <FocusTable onNavigate={onNavigate} />
      <div className="feed-grid">
        <FeedColumn
          title="LATEST NOTES"
          entries={notes}
          type="notes"
          onNavigate={onNavigate}
        />
        <FeedColumn
          title="RECENT POSTS"
          entries={posts}
          type="posts"
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

function EmptyState({ title, text, onNavigate }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      <InternalLink className="text-arrow" to="/admin" onNavigate={onNavigate}>
        Open Admin
        <ArrowRight size={17} aria-hidden="true" />
      </InternalLink>
    </div>
  );
}

function CollectionPage({ type, entries, onNavigate }) {
  const isNotes = type === "notes";
  return (
    <div className="collection-page">
      <PageHeader
        eyebrow={isNotes ? "QUICK THOUGHTS" : "LONG-FORM"}
        title={isNotes ? "Notes" : "Posts"}
        description={
          isNotes
            ? "Short observations from active work, kept intentionally lightweight."
            : "Essays, experiments, and longer reflections on AI and creative work."
        }
        onNavigate={onNavigate}
      />
      <div className="collection-list">
        {entries.map((entry, index) => (
          <InternalLink
            className="collection-row"
            key={entry.slug}
            to={`/${type}/${entry.slug}`}
            onNavigate={onNavigate}
          >
            <span className="collection-row__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="collection-row__copy">
              <strong>{entry.title}</strong>
              <span>{entry.summary || entry.description}</span>
            </span>
            <time dateTime={entry.date}>{formatDate(entry.date, true)}</time>
            <ArrowRight size={18} aria-hidden="true" />
          </InternalLink>
        ))}
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, onNavigate }) {
  return (
    <header className="page-header">
      <InternalLink className="back-link" to="/" onNavigate={onNavigate}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to index
      </InternalLink>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function ArticlePage({ entry, type, onNavigate }) {
  if (!entry) return <NotFound onNavigate={onNavigate} />;
  const collectionPath = type === "focus" ? "/" : `/${type}`;
  const date = entry.updated || entry.date;

  return (
    <article className="article-page">
      <InternalLink className="back-link" to={collectionPath} onNavigate={onNavigate}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to {type === "focus" ? "index" : type}
      </InternalLink>

      <header className="article-header">
        <div className="article-meta">
          <span>{type.toUpperCase()}</span>
          {type === "focus" && <span>{entry.status}</span>}
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
        <h1>{entry.title}</h1>
        <p>{entry.why || entry.summary || entry.description}</p>
      </header>

      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt, ...props }) => (
              <img
                src={src?.startsWith("/uploads/") ? `${BASE}${src.slice(1)}` : src}
                alt={alt || ""}
                {...props}
              />
            ),
          }}
        >
          {entry.body}
        </ReactMarkdown>
      </div>
    </article>
  );
}

function AdminPage({ onNavigate }) {
  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="PRIVATE WORKFLOW"
        title="Content Studio"
        description="Publish focus items, notes, and posts without touching the codebase."
        onNavigate={onNavigate}
      />

      <div className="admin-panel">
        <div className="admin-panel__intro">
          <span className="admin-kicker">PAGES CMS + GITHUB</span>
          <h2>Your content stays in your repository.</h2>
          <p>
            Sign in with GitHub, choose the OneFocus repository, edit in the visual
            studio, and press Save. GitHub Pages rebuilds the site automatically.
          </p>
          <a
            className="admin-button"
            href="https://app.pagescms.org"
            target="_blank"
            rel="noreferrer"
          >
            Open content studio
            <ArrowSquareOut size={18} aria-hidden="true" />
          </a>
        </div>

        <ol className="admin-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Connect GitHub</strong>
              <p>Install the Pages CMS GitHub App for the OneFocus repository.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Create or edit</strong>
              <p>Use the Focus, Notes, and Posts collections already configured.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Publish</strong>
              <p>Save once. The change is committed and the site redeploys.</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="admin-note">
        <GithubLogo size={21} aria-hidden="true" />
        <p>
          The editor becomes active after this project is pushed to GitHub. No
          passwords, tokens, or database are stored in the public website.
        </p>
      </div>
    </div>
  );
}

function NotFound({ onNavigate }) {
  return (
    <div className="not-found">
      <span>404</span>
      <h1>Nothing is indexed here.</h1>
      <InternalLink className="text-arrow" to="/" onNavigate={onNavigate}>
        Return home
        <ArrowRight size={17} aria-hidden="true" />
      </InternalLink>
    </div>
  );
}

function RouteContent({ route, onNavigate }) {
  if (route === "/") return <HomePage onNavigate={onNavigate} />;
  if (route === "/notes") {
    return <CollectionPage type="notes" entries={notes} onNavigate={onNavigate} />;
  }
  if (route === "/posts") {
    return <CollectionPage type="posts" entries={posts} onNavigate={onNavigate} />;
  }
  if (route === "/admin") return <AdminPage onNavigate={onNavigate} />;

  const [collection, slug] = route.split("/").filter(Boolean);
  if (collection === "focus") {
    return (
      <ArticlePage
        entry={focusItems.find((item) => item.slug === slug)}
        type="focus"
        onNavigate={onNavigate}
      />
    );
  }
  if (collection === "notes") {
    return (
      <ArticlePage
        entry={notes.find((item) => item.slug === slug)}
        type="notes"
        onNavigate={onNavigate}
      />
    );
  }
  if (collection === "posts") {
    return (
      <ArticlePage
        entry={posts.find((item) => item.slug === slug)}
        type="posts"
        onNavigate={onNavigate}
      />
    );
  }

  return <NotFound onNavigate={onNavigate} />;
}

export function App() {
  const [route, setRoute] = useState(currentRoute);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark",
  );

  const pageTitle = useMemo(() => {
    if (route === "/") return `${siteConfig.title} — ${siteConfig.subtitle}`;
    if (route === "/admin") return `Content Studio — ${siteConfig.title}`;
    if (route === "/notes") return `Notes — ${siteConfig.title}`;
    if (route === "/posts") return `Posts — ${siteConfig.title}`;
    const slug = route.split("/").filter(Boolean).at(-1);
    const entry = [...focusItems, ...notes, ...posts].find(
      (item) => item.slug === slug,
    );
    return entry ? `${entry.title} — ${siteConfig.title}` : `404 — ${siteConfig.title}`;
  }, [route]);

  function syncRoute() {
    setRoute(currentRoute());
  }

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("onefocus-theme", nextTheme);
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
  }

  useEffect(() => {
    function handlePopState() {
      syncRoute();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <div className="site-shell">
      <Sidebar route={route} onNavigate={syncRoute} />
      <main className="main-content">
        <ThemeSwitch theme={theme} onChange={changeTheme} />
        <RouteContent route={route} onNavigate={syncRoute} />
      </main>
    </div>
  );
}
