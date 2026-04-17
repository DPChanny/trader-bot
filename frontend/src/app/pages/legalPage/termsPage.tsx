import termsMarkdown from "../../../content/legal/terms-of-service.md?raw";
import { LegalDocumentPage } from "./legalDocumentPage";
import { parseLegalMarkdown } from "./legalMarkdown";

const termsDocument = parseLegalMarkdown(termsMarkdown);

export function TermsPage() {
  return <LegalDocumentPage {...termsDocument} />;
}
