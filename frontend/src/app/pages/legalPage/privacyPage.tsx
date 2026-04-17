import privacyMarkdown from "../../../content/legal/privacy-policy.md?raw";
import { MarkedPage } from "@components/molecules/markedPage";
import { parseMarkedDocument } from "@utils/marked";

const privacyDocument = parseMarkedDocument(privacyMarkdown);

export function PrivacyPage() {
  return (
    <MarkedPage
      eyebrow="PUBLIC POLICY"
      title={privacyDocument.title}
      intro={privacyDocument.intro}
      effectiveDate={privacyDocument.effectiveDate}
      sections={privacyDocument.sections}
    />
  );
}
