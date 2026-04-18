"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { MediaPicker } from "./media-picker";

type MdApi = { replaceSelection?: (text: string) => void };

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 border border-border rounded-md bg-zinc-50" />
    ),
  },
);

export function MarkdownEditor({
  name,
  defaultValue = "",
  height = 480,
}: {
  name: string;
  defaultValue?: string;
  height?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);
  const apiRef = useRef<MdApi | null>(null);

  const handlePick = useCallback((file: { url: string; alt: string }) => {
    const snippet = `![${file.alt}](${file.url})`;
    const api = apiRef.current;
    if (api?.replaceSelection) {
      api.replaceSelection(snippet);
    } else {
      setValue((v) => (v ? `${v}\n\n${snippet}\n` : `${snippet}\n`));
    }
    setPickerOpen(false);
  }, []);

  const imageCommand = useMemo(
    () => ({
      name: "insert-media",
      keyCommand: "insert-media",
      buttonProps: { "aria-label": "Bild aus Mediathek einfügen", title: "Bild aus Mediathek" },
      icon: (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
          <path d="M3 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H3Zm0 1h14v7.59l-3.3-3.3a1 1 0 0 0-1.4 0L9 12.6 7.7 11.3a1 1 0 0 0-1.4 0L3 14.6V5Zm10 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      ),
      execute: (_state: unknown, api: MdApi) => {
        apiRef.current = api;
        setPickerOpen(true);
      },
    }),
    [],
  );

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => setValue(v ?? "")}
        height={height}
        preview="live"
        textareaProps={{ spellCheck: true }}
        commands={undefined}
        extraCommands={[imageCommand]}
      />
      <textarea name={name} value={value} readOnly hidden />
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />
    </div>
  );
}
