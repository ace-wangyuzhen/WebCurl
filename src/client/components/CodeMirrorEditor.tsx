import { useEffect, useRef, useState } from "react";
import { minimalSetup } from "codemirror";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState, type Extension } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";

export type EditorLanguage = "json" | "javascript" | "text";

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: EditorLanguage;
  ariaLabel: string;
  minHeight?: number;
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

export function CodeMirrorEditor({
  value,
  onChange,
  language,
  ariaLabel,
  minHeight = 120,
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
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
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
  }, [language, failed]);

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
        onChange={(event) => onChange(event.target.value)}
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
