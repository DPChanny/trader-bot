import { Link } from "@components/atoms/link";
import { DefinitionList } from "@components/molecules/definitionList";
import { HtmlContent } from "@components/molecules/htmlContent";
import { InfoPage } from "@components/molecules/infoPage";
import { PageHero } from "@components/molecules/pageHero";
import { PageSection } from "@components/molecules/pageSection";
import {
  GUILD_INVITE_URL,
  GUILD_INVITE_URL_TEXT,
  SITE_OPERATOR,
} from "@utils/env";

export type LegalDocument = {
  title: string;
  intro: string;
  effectiveDate?: string;
  bodyHtml: string;
  footerHtml?: string;
};

export function LegalDocumentPage({
  title,
  intro,
  effectiveDate,
  bodyHtml,
  footerHtml,
}: LegalDocument) {
  return (
    <InfoPage>
      <PageHero
        eyebrow="PUBLIC POLICY"
        title={title}
        description={intro}
        meta={effectiveDate ? `시행일 ${effectiveDate}` : undefined}
        actions={<Link href="/">홈으로 돌아가기</Link>}
      />

      <PageSection>
        <HtmlContent html={bodyHtml} />
      </PageSection>

      <PageSection
        title="운영 길드"
        description="서비스 공지와 문의는 운영 길드에서 확인할 수 있습니다."
        variantSurface="tertiary"
      >
        <DefinitionList
          items={[
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
        {footerHtml && <HtmlContent html={footerHtml} variantTone="muted" />}
      </PageSection>
    </InfoPage>
  );
}
