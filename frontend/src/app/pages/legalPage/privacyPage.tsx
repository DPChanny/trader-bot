import privacyMarkdown from "../../../content/legal/privacy-policy.md?raw";
import { Link } from "@components/atoms/link";
import { MarkedPage } from "@components/molecules/markedPage";
import {
  GUILD_INVITE_URL,
  GUILD_INVITE_URL_TEXT,
  SITE_OPERATOR,
} from "@utils/env";
import { parseMarkedDocument } from "@utils/marked";

const privacyDocument = parseMarkedDocument(privacyMarkdown);

export function PrivacyPage() {
  return (
    <MarkedPage
      eyebrow="PUBLIC POLICY"
      title={privacyDocument.title}
      intro={privacyDocument.intro}
      meta={
        privacyDocument.effectiveDate
          ? `시행일 ${privacyDocument.effectiveDate}`
          : undefined
      }
      sections={privacyDocument.sections}
      footerBlocks={privacyDocument.footerBlocks}
      supplementaryTitle="운영 길드"
      supplementaryDescription="서비스 공지와 문의는 운영 길드에서 확인할 수 있습니다."
      supplementaryItems={[
        {
          label: "운영자",
          value: SITE_OPERATOR,
        },
        {
          label: "운영 길드",
          value: (
            <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
              {GUILD_INVITE_URL_TEXT}
            </Link>
          ),
        },
      ]}
    />
  );
}
