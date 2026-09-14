import { useEffect, useRef, useState } from "react";
import { minimalSetup } from "codemirror";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState, type Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";

export type EditorLanguage = "json" | "javascript" | "text";

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: EditorLanguage;
  ariaLabel: string;
  minHeight?: number;
  readOnly?: boolean;
  wrap?: boolean;
}

function languageExtension(language: EditorLanguage): Extension {
  if (language === "json") {
    return json();
  }
  if (language === "javascript") {
    return javascript();
  }
  return [];
}

// Colors reference CSS variables so highlighting follows the active theme
// without re-creating the editor state on toggle.
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--cm-keyword)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--cm-string)" },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom],
    color: "var(--cm-number)",
  },
  { tag: tags.comment, color: "var(--cm-comment)", fontStyle: "italic" },
  {
    tag: [tags.propertyName, tags.attributeName],
    color: "var(--cm-property)",
  },
  {
    tag: [tags.definition(tags.variableName), tags.function(tags.variableName)],
    color: "var(--cm-def)",
  },
  { tag: [tags.operator, tags.punctuation], color: "var(--cm-operator)" },
  { tag: tags.variableName, color: "var(--cm-variable)" },
  { tag: [tags.meta, tags.tagName], color: "var(--cm-atom)" },
  { tag: [tags.heading, tags.strong], fontWeight: "bold" },
  { tag: tags.invalid, color: "var(--status-error)" },
]);

const editorTheme = (minHeight: number) =>
  EditorView.theme({
    "&": {
      minHeight: `${minHeight}px`,
      backgroundColor: "var(--code-bg)",
      color: "var(--ink)",
    },
    ".cm-scroller": {
      minHeight: `${minHeight}px`,
      overflow: "auto",
      fontFamily: "var(--font-mono)",
    },
    ".cm-content": {
      caretColor: "var(--ink)",
      lineHeight: "1.6",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      borderRight: "1px solid var(--border-color)",
      color: "var(--text-tertiary)",
    },
    ".cm-activeLine": { backgroundColor: "var(--surface-hover)" },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--surface-hover)",
      color: "var(--text-secondary)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "var(--accent-soft-strong)",
    },
    ".cm-cursor": { borderLeftColor: "var(--ink)" },
    ".cm-matchingBracket": {
      backgroundColor: "var(--accent-soft)",
      outline: "1px solid var(--border-strong)",
    },
  });

export function CodeMirrorEditor({
  value,
  onChange,
  language,
  ariaLabel,
  minHeight = 120,
  readOnly = false,
  wrap = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [failed, setFailed] = useState(false);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (failed || !containerRef.current) {
      return;
    }

    let view: EditorView;
    try {
      const state = EditorState.create({
        doc: value,
        extensions: [
          minimalSetup,
          lineNumbers(),
          languageExtension(language),
          syntaxHighlighting(highlightStyle),
          editorTheme(minHeight),
          ...(wrap ? [EditorView.lineWrapping] : []),
          ...(readOnly
            ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
            : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        ],
      });
      view = new EditorView({ state, parent: containerRef.current });
    } catch {
      setFailed(true);
      return;
    }

    viewRef.current = view;
    view.contentDOM.setAttribute("aria-label", ariaLabel);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, failed, readOnly, minHeight, wrap]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  if (failed) {
    return (
      <textarea
        className="code-mirror-editor-fallback"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label={ariaLabel}
        style={{ minHeight, width: "100%" }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="code-mirror-editor"
      aria-label={ariaLabel}
      style={{ minHeight }}
    />
  );
}
