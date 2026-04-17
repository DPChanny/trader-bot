import termsOfServiceMarkdown from "@docs/legals/termsOfService.md?raw";
import { MarkedPage } from "@components/molecules/markedPage";
import { parseMarkedDocument } from "@utils/marked";

const termsOfServiceDocument = parseMarkedDocument(termsOfServiceMarkdown);

export function TermsOfServicePage() {
  return (
    <MarkedPage
      title={termsOfServiceDocument.title}
      intro={termsOfServiceDocument.intro}
      effectiveDate={termsOfServiceDocument.effectiveDate}
      sections={termsOfServiceDocument.sections}
    />
  );
}
