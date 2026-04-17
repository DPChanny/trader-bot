import termsMarkdown from "../../../content/legal/terms-of-service.md?raw";
import { MarkedPage } from "@components/molecules/markedPage";
import { parseMarkedDocument } from "@utils/marked";

const termsDocument = parseMarkedDocument(termsMarkdown);

export function TermsPage() {
  return (
    <MarkedPage
      eyebrow="PUBLIC POLICY"
      title={termsDocument.title}
      intro={termsDocument.intro}
      effectiveDate={termsDocument.effectiveDate}
      sections={termsDocument.sections}
    />
  );
}
