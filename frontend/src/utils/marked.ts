import { marked } from "marked";
import type { Tokens } from "marked";

export type MarkedBlock =
  | {
      type: "heading";
      depth: number;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    };

export type MarkedDocument = {
  blocks: MarkedBlock[];
};

function toBlocks(token: Tokens.Generic): MarkedBlock[] {
  if (token.type === "heading") {
    return token.text.trim()
      ? [
          {
            type: "heading",
            depth: token.depth,
            text: token.text.trim(),
          },
        ]
      : [];
  }

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
  const blocks = tokens.flatMap((token) => toBlocks(token));

  return { blocks };
}
