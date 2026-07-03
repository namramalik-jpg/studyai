"use client";

import { useMemo } from "react";

function parseOutputLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return { type: "space", text: "" };
  }

  const markdownHeading = trimmed.match(/^(#{1,6})\s+(.+)$/);

  if (markdownHeading) {
    return {
      type: markdownHeading[1].length === 1 ? "title" : "heading",
      text: markdownHeading[2].trim(),
    };
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return { type: "bullet", text: trimmed.replace(/^[-*]\s+/, "") };
  }

  if (/^\d+[.)]\s+/.test(trimmed)) {
    return { type: "numbered", text: trimmed };
  }

  if (trimmed.endsWith(":") && trimmed.length <= 80) {
    return { type: "heading", text: trimmed.replace(/:$/, "") };
  }

  return { type: "paragraph", text: trimmed };
}

export default function AIOutputFormatter({ content }) {
  const blocks = useMemo(
    () => String(content || "").split("\n").map(parseOutputLine),
    [content]
  );

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "space") {
          return <div key={key} className="h-1" />;
        }

        if (block.type === "title") {
          return (
            <h2 key={key} className="break-words text-2xl font-black tracking-tight text-text">
              {block.text}
            </h2>
          );
        }

        if (block.type === "heading") {
          return (
            <h3 key={key} className="pt-2 text-lg font-black tracking-tight text-text">
              {block.text}
            </h3>
          );
        }

        if (block.type === "bullet") {
          return (
            <div key={key} className="flex gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <p className="break-words text-sm leading-7 text-muted [overflow-wrap:anywhere]">
                {block.text}
              </p>
            </div>
          );
        }

        if (block.type === "numbered") {
          return (
            <p key={key} className="break-words rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold leading-7 text-primary-hover [overflow-wrap:anywhere] dark:text-primary">
              {block.text}
            </p>
          );
        }

        return (
          <p key={key} className="break-words text-sm leading-7 text-muted [overflow-wrap:anywhere]">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
