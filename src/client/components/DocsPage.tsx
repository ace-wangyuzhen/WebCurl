import { useState, type ReactNode } from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useTranslation, type MessageKey } from "../i18n";

interface DocsPageProps {
  onBack: () => void;
}

interface DocSection {
  id: string;
  titleKey: MessageKey;
  bodyKey: MessageKey;
}

const SECTIONS: DocSection[] = [
  { id: "overview", titleKey: "docs.overview.title", bodyKey: "docs.overview.body" },
  { id: "collections", titleKey: "docs.collections.title", bodyKey: "docs.collections.body" },
  { id: "building", titleKey: "docs.building.title", bodyKey: "docs.building.body" },
  { id: "scripts", titleKey: "docs.scripts.title", bodyKey: "docs.scripts.body" },
  { id: "environments", titleKey: "docs.environments.title", bodyKey: "docs.environments.body" },
  { id: "response", titleKey: "docs.response.title", bodyKey: "docs.response.body" },
  { id: "curl", titleKey: "docs.curl.title", bodyKey: "docs.curl.body" },
  { id: "import-export", titleKey: "docs.importExport.title", bodyKey: "docs.importExport.body" },
  { id: "history", titleKey: "docs.history.title", bodyKey: "docs.history.body" },
  { id: "settings", titleKey: "docs.settings.title", bodyKey: "docs.settings.body" },
  { id: "shortcuts", titleKey: "docs.shortcuts.title", bodyKey: "docs.shortcuts.body" },
];

// Split a translation string on backticks and render the fenced parts as
// inline code. No HTML is injected — backticks become React <code> elements.
function renderRich(text: string): ReactNode[] {
  return text.split("`").map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="docs-inline-code">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

function RequestBarExample() {
  const { t } = useTranslation();
  return (
    <div
      className="docs-request-example"
      role="img"
      aria-label={t("docs.building.exampleLabel")}
    >
      <span className="docs-method" data-method="GET">
        GET
      </span>
      <code className="docs-request-url">
        https://api.example.com/v1/users?page=1
      </code>
    </div>
  );
}

function ScriptCodeBlock() {
  return (
    <pre className="docs-code-block">
      <code>
        {`pm.environment.set("token", "abc123");
const token = pm.environment.get("token");
console.log("token:", token);`}
      </code>
    </pre>
  );
}

export function DocsPage({ onBack }: DocsPageProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  return (
    <div className="docs-page">
      <header className="docs-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          aria-label={t("docs.back")}
        >
          {t("docs.back")}
        </Button>
        <h1 className="docs-title">{t("docs.title")}</h1>
      </header>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label={t("docs.toc")}>
          <p className="docs-toc-heading">{t("docs.toc")}</p>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={section.id === activeId ? "is-active" : undefined}
                  onClick={() => setActiveId(section.id)}
                >
                  {t(section.titleKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="docs-content">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="docs-section">
              <h2 className="docs-section-title">{t(section.titleKey)}</h2>
              <p className="docs-section-body">{renderRich(t(section.bodyKey))}</p>
              {section.id === "building" ? <RequestBarExample /> : null}
              {section.id === "scripts" ? <ScriptCodeBlock /> : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
