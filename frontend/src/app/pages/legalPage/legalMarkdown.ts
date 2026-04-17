import { marked } from "marked";
import type { Tokens } from "marked";
import type { LegalDocument } from "./legalDocumentPage";

export function parseLegalMarkdown(markdown: string): LegalDocument {
  const tokens = marked.lexer(markdown, { gfm: true });
  let title = "";
  let effectiveDate: string | undefined;
  const introParts: string[] = [];
  const bodyTokens: Tokens.Generic[] = [];
  const footerTokens: Tokens.Generic[] = [];

  let hasReachedBody = false;
  let isFooter = false;

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
    }

    if (token.type === "paragraph" && token.text.trim() === "부칙") {
      isFooter = true;
      continue;
    }

    if (isFooter) {
      footerTokens.push(token);
      continue;
    }

    if (!hasReachedBody) {
      if (token.type === "paragraph") {
        introParts.push(token.text.trim());
      }
      continue;
    }

    bodyTokens.push(token);
  }

  return {
    title,
    intro: introParts.join(" "),
    effectiveDate,
    bodyHtml: marked.parser(bodyTokens),
    footerHtml: footerTokens.length ? marked.parser(footerTokens) : undefined,
  };
}
