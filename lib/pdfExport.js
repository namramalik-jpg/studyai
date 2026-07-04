function safeFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function safeFileName(value) {
  return String(value || "note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

const textReplacements = {
  "\u00a0": " ",
  "\u2013": "-",
  "\u2014": "-",
  "\u2212": "-",
  "\u2192": "->",
  "\u2190": "<-",
  "\u21d2": "=>",
  "\u00d7": "x",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2022": "-",
  "\u2080": "0",
  "\u2081": "1",
  "\u2082": "2",
  "\u2083": "3",
  "\u2084": "4",
  "\u2085": "5",
  "\u2086": "6",
  "\u2087": "7",
  "\u2088": "8",
  "\u2089": "9",
  "\u00b2": "^2",
  "\u00b3": "^3",
};

function normalizeCharacters(value) {
  return String(value || "")
    .replace(/[\u00a0\u2013\u2014\u2212\u2192\u2190\u21d2\u00d7\u2018\u2019\u201c\u201d\u2022\u2080-\u2089\u00b2\u00b3]/g, (character) => textReplacements[character] || "")
    .replace(/[\u200b-\u200d\ufeff]/g, "");
}

function stripMarkdown(value) {
  return normalizeCharacters(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForCompare(value) {
  return stripMarkdown(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseContentLine(rawLine) {
  const line = normalizeCharacters(rawLine).trimEnd();
  const trimmed = line.trim();

  if (!trimmed) {
    return { type: "blank" };
  }

  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

  if (headingMatch) {
    return {
      type: "heading",
      level: headingMatch[1].length,
      text: stripMarkdown(headingMatch[2]).replace(/[:\-]+$/, ""),
    };
  }

  const boldHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*$/);

  if (boldHeadingMatch) {
    return {
      type: "heading",
      level: 2,
      text: stripMarkdown(boldHeadingMatch[1]).replace(/[:\-]+$/, ""),
    };
  }

  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);

  if (bulletMatch) {
    return {
      type: "list",
      marker: "-",
      text: stripMarkdown(bulletMatch[1]),
    };
  }

  const numberedMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);

  if (numberedMatch) {
    return {
      type: "list",
      marker: numberedMatch[1],
      text: stripMarkdown(numberedMatch[2]),
    };
  }

  return {
    type: "paragraph",
    text: stripMarkdown(trimmed.replace(/^#{1,6}\s*/, "")),
  };
}

function addPageNumbers(doc, pageWidth, pageHeight, margin) {
  const pageCount = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - margin, pageHeight - 28, {
      align: "right",
    });
  }
}

export function generateSingleNotePdf(note, jsPDF) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  const bottom = pageHeight - 64;
  let y = 126;

  function ensureSpace(requiredSpace = 28) {
    if (y + requiredSpace <= bottom) {
      return;
    }

    doc.addPage();
    y = margin;
  }

  function setTextStyle({ color = [51, 65, 85], fontSize = 11.5, fontStyle = "normal" } = {}) {
    doc.setTextColor(...color);
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
  }

  function addWrappedText(text, x, width, lineHeight) {
    const lines = doc.splitTextToSize(stripMarkdown(text), width);

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line || " ", x, y);
      y += lineHeight;
    });
  }

  function addHeading(text, level = 2) {
    const fontSize = level <= 1 ? 16 : level === 2 ? 14 : 12.5;
    const lineHeight = level <= 1 ? 21 : level === 2 ? 19 : 17;

    y += level <= 2 ? 14 : 10;
    setTextStyle({
      color: [15, 23, 42],
      fontSize,
      fontStyle: "bold",
    });
    addWrappedText(text, margin, maxWidth, lineHeight);
    y += 5;
  }

  function addParagraph(text) {
    setTextStyle();
    addWrappedText(text, margin, maxWidth, 17);
    y += 4;
  }

  function addListItem(marker, text) {
    const markerText = `${marker} `;
    const markerWidth = marker.match(/\d/) ? 26 : 14;
    const bodyX = margin + markerWidth;
    const bodyWidth = maxWidth - markerWidth;
    const bodyLines = doc.splitTextToSize(stripMarkdown(text), bodyWidth);

    setTextStyle();

    bodyLines.forEach((line, index) => {
      ensureSpace(17);

      if (index === 0) {
        doc.text(`${markerText}${line}`, margin, y);
      } else {
        doc.text(line, bodyX, y);
      }

      y += 17;
    });

    y += 4;
  }

  function addStructuredContent(text) {
    const titleKey = normalizeForCompare(note.title || "");
    let hasRenderedContent = false;

    String(text || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(parseContentLine)
      .forEach((line) => {
        if (line.type === "blank") {
          if (hasRenderedContent) {
            y += 8;
          }

          return;
        }

        if (line.type === "heading") {
          if (!hasRenderedContent && titleKey && normalizeForCompare(line.text) === titleKey) {
            return;
          }

          addHeading(line.text, line.level);
          hasRenderedContent = true;
          return;
        }

        if (line.type === "list") {
          addListItem(line.marker, line.text);
          hasRenderedContent = true;
          return;
        }

        addParagraph(line.text);
        hasRenderedContent = true;
      });
  }

  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, pageWidth, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("StudyAI Note", margin, 40);

  setTextStyle({
    color: [15, 23, 42],
    fontSize: 24,
    fontStyle: "bold",
  });
  addWrappedText(note.title || "Untitled Note", margin, maxWidth, 28);

  y += 22;
  doc.setDrawColor(219, 234, 254);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  addStructuredContent(note.content);

  addPageNumbers(doc, pageWidth, pageHeight, margin);
  doc.save(`studyai-${safeFileName(note.title)}-${safeFileDate()}.pdf`);
}
