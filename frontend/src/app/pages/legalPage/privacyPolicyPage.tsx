import privacyPolicyMarkdown from "@docs/legals/privacyPolicy.md?raw";
import { MarkedPage } from "@components/molecules/markedPage";
import { parseMarkedDocument } from "@utils/marked";

const privacyPolicyDocument = parseMarkedDocument(privacyPolicyMarkdown);

export function PrivacyPolicyPage() {
  return (
    <MarkedPage
      title={privacyPolicyDocument.title}
      intro={privacyPolicyDocument.intro}
      effectiveDate={privacyPolicyDocument.effectiveDate}
      sections={privacyPolicyDocument.sections}
    />
  );
}
