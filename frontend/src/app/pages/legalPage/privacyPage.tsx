import privacyMarkdown from "../../../content/legal/privacy-policy.md?raw";
import { LegalDocumentPage } from "./legalDocumentPage";
import { parseLegalMarkdown } from "./legalMarkdown";

const privacyDocument = parseLegalMarkdown(privacyMarkdown);

export function PrivacyPage() {
  return <LegalDocumentPage {...privacyDocument} />;
}
