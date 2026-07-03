function getWrappedLines(doc, text, maxWidth) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .flatMap((paragraph) => {
      if (!paragraph.trim()) {
        return [""];
      }

      return doc.splitTextToSize(paragraph, maxWidth);
    });
}

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

const boldSectionHeadings = [
  "title",
  "simple definition",
  "key points",
  "benefits of database system",
  "benefits of database systems",
  "common example of dbms",
  "example",
  "quick revision",
  "practice question",
  "practice questions",
];

function normalizeHeading(value) {
  return String(value || "")
    .trim()
    .replace(/^[-#*\d.)\s]+/, "")
    .replace(/[:\-]+$/, "")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBoldSectionHeading(value) {
  const cleanLine = String(value || "")
    .trim()
    .replace(/^[-#*\d.)\s]+/, "")
    .trim();

  const sortedHeadings = [...boldSectionHeadings].sort(
    (first, second) => second.length - first.length
  );

  for (const heading of sortedHeadings) {
    const pattern = new RegExp(
      `^(${escapeRegExp(heading)})(?:\\s*[:\\-]\\s*|\\s*$)(.*)$`,
      "i"
    );
    const match = cleanLine.match(pattern);

    if (match) {
      return {
        heading: match[1].trim(),
        normalizedHeading: normalizeHeading(match[1]),
        rest: match[2].trim(),
      };
    }
  }

  return null;
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

  function addLines(lines, lineHeight = 16) {
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line || " ", margin, y);
      y += lineHeight;
    });
  }

  function addLinesAt(lines, x, lineHeight = 16) {
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line || " ", x, y);
      y += lineHeight;
    });
  }

  function isKeyPointsSection(section) {
    return section === "key points";
  }

  function isBenefitsSection(section) {
    return (
      section === "benefits of database system" ||
      section === "benefits of database systems"
    );
  }

  function isNumberedLine(line) {
    return /^(\d+[.)])\s*(.+)$/.test(String(line || "").trim());
  }

  function splitNumberedLine(line, section) {
    const match = String(line || "")
      .trim()
      .match(/^(\d+[.)])\s*(.+)$/);

    if (!match) {
      return null;
    }

    const marker = match[1];
    const body = match[2].trim();
    let title = body;
    let answer = "";

    if (isKeyPointsSection(section)) {
      const questionEnd = body.indexOf("?");

      if (questionEnd === -1) {
        return null;
      }

      if (questionEnd !== -1) {
        title = body.slice(0, questionEnd + 1).trim();
        answer = body.slice(questionEnd + 1).replace(/^[:\-\s]+/, "").trim();
      }
    }

    if (isBenefitsSection(section)) {
      const colonIndex = body.indexOf(":");
      const dashIndex = body.indexOf(" - ");
      const splitIndex =
        colonIndex !== -1
          ? colonIndex
          : dashIndex !== -1
            ? dashIndex
            : -1;

      if (splitIndex !== -1) {
        title =
          splitIndex === colonIndex
            ? `${body.slice(0, splitIndex).trim()}:`
            : body.slice(0, splitIndex).trim();
        answer = body.slice(splitIndex + (splitIndex === colonIndex ? 1 : 3)).trim();
      }
    }

    return {
      marker,
      title,
      answer,
    };
  }

  function addSpecialNumberedItem(line, section) {
    const numberedItem = splitNumberedLine(line, section);

    if (!numberedItem) {
      return false;
    }

    const answerIndent = margin + 18;
    const answerWidth = maxWidth - 18;

    y += 8;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.8);
    addLinesAt(
      getWrappedLines(doc, `${numberedItem.marker} ${numberedItem.title}`, maxWidth),
      margin,
      17
    );

    if (numberedItem.answer) {
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);
      addLinesAt(getWrappedLines(doc, numberedItem.answer, answerWidth), answerIndent, 17);
    }

    y += 8;
    return true;
  }

  function addIndentedAnswer(line) {
    const answerIndent = margin + 18;
    const answerWidth = maxWidth - 18;

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    addLinesAt(getWrappedLines(doc, line, answerWidth), answerIndent, 17);
    y += 6;
  }

  function addStructuredContent(text) {
    let currentSection = "";
    let shouldIndentNextAnswer = false;

    String(text || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .forEach((line) => {
        const headingMatch = getBoldSectionHeading(line);

        if (headingMatch) {
          currentSection = headingMatch.normalizedHeading;
          shouldIndentNextAnswer = false;
          y += 10;
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          addLines(getWrappedLines(doc, headingMatch.heading, maxWidth), 18);
          y += 4;

          if (headingMatch.rest) {
            doc.setTextColor(51, 65, 85);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11.5);
            addLines(getWrappedLines(doc, headingMatch.rest, maxWidth), 17);
          }

          return;
        }

        if (
          (isKeyPointsSection(currentSection) || isBenefitsSection(currentSection)) &&
          line.trim()
        ) {
          const renderedSpecialItem = addSpecialNumberedItem(line, currentSection);

          if (renderedSpecialItem) {
            const numberedItem = splitNumberedLine(line, currentSection);
            shouldIndentNextAnswer = !numberedItem?.answer;
            return;
          }

          if (shouldIndentNextAnswer && !isNumberedLine(line)) {
            addIndentedAnswer(line);
            shouldIndentNextAnswer = false;
            return;
          }

          if (isNumberedLine(line)) {
            shouldIndentNextAnswer = false;
          }
        }

        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11.5);
        addLines(getWrappedLines(doc, line, maxWidth), 17);
      });
  }

  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, pageWidth, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("StudyAI Note", margin, 40);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  addLines(getWrappedLines(doc, note.title || "Untitled Note", maxWidth), 28);

  y += 22;
  doc.setDrawColor(219, 234, 254);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  addStructuredContent(note.content);

  addPageNumbers(doc, pageWidth, pageHeight, margin);
  doc.save(`studyai-${safeFileName(note.title)}-${safeFileDate()}.pdf`);
}
