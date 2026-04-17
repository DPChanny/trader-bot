import { marked } from "marked";
import type { Tokens } from "marked";

export type MarkedBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    };

export type MarkedSection = {
  title: string;
  blocks: MarkedBlock[];
};

export type MarkedDocument = {
  title: string;
  intro: string;
  effectiveDate?: string;
  sections: MarkedSection[];
  footerBlocks?: MarkedBlock[];
};

function toBlocks(token: Tokens.Generic): MarkedBlock[] {
  if (token.type === "paragraph") {
    return token.text.trim()
      ? [
          {
            type: "paragraph",
            text: token.text.trim(),
          },
        ]
      : [];
  }

  if (token.type === "list") {
    const items = token.items
      .map((item: Tokens.ListItem) => item.text.trim())
      .filter((item: string) => item.length > 0);

    return items.length
      ? [
          {
            type: "list",
            items,
          },
        ]
      : [];
  }

  return [];
}

export function parseMarkedDocument(markdown: string): MarkedDocument {
  const tokens = marked.lexer(markdown, { gfm: true });
  let title = "";
  let effectiveDate: string | undefined;
  const introParts: string[] = [];
  const sections: MarkedSection[] = [];
  const footerBlocks: MarkedBlock[] = [];

  let hasReachedBody = false;
  let isFooter = false;
  let currentSection: MarkedSection | undefined;

  for (const token of tokens) {
    if (token.type === "heading" && token.depth === 1 && !title) {
      title = token.text.trim();
      continue;
    }

    if (token.type === "paragraph" && !effectiveDate) {
      const text = token.text.trim();
      if (text.startsWith("시행일:")) {
        effectiveDate = text.slice("시행일:".length).trim();
        continue;
      }
    }

    if (token.type === "heading" && token.depth >= 2) {
      hasReachedBody = true;
      currentSection = {
        title: token.text.trim(),
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (token.type === "paragraph" && token.text.trim() === "부칙") {
      isFooter = true;
      continue;
    }

    if (isFooter) {
      footerBlocks.push(...toBlocks(token));
      continue;
    }

    if (!hasReachedBody) {
      if (token.type === "paragraph") {
        introParts.push(token.text.trim());
      }
      continue;
    }

    currentSection?.blocks.push(...toBlocks(token));
  }

  return {
    title,
    intro: introParts.join(" "),
    effectiveDate,
    sections,
    footerBlocks: footerBlocks.length ? footerBlocks : undefined,
  };
}
