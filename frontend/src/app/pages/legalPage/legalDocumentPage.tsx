import { Column, Page, Scroll } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import styles from "@styles/pages/publicPage.module.css";
import { SITE_DISCORD_SERVER_URL, SITE_OPERATOR } from "@utils/env";

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
    <Page className={styles.pageShell}>
      <Scroll axis="y" className={styles.pageScroll}>
        <Column gap="xl" className={styles.publicContainer}>
          <PrimarySection className={styles.heroSection}>
            <header className={styles.heroHeader}>
              <p className={styles.eyebrow}>PUBLIC POLICY</p>
              <h1 className={styles.heroTitle}>{title}</h1>
              <p className={styles.heroLead}>{intro}</p>
              {effectiveDate && (
                <p className={styles.metaText}>시행일 {effectiveDate}</p>
              )}
            </header>
            <div className={styles.linkGroup}>
              <a href="/" className={styles.inlineLink}>
                홈으로 돌아가기
              </a>
            </div>
          </PrimarySection>

          <SecondarySection className={styles.legalSection}>
            <div
              className={styles.legalMarkdown}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </SecondarySection>

          <TertiarySection className={styles.contentSection}>
            <section>
              <h2 className={styles.sectionTitle}>공식 채널</h2>
              <p className={styles.bodyText}>
                서비스 공지와 문의는 공식 채널 기준으로 운영합니다.
              </p>
              <dl className={styles.contactList}>
                <div className={styles.contactRow}>
                  <dt className={styles.contactLabel}>운영자</dt>
                  <dd className={styles.contactValue}>{SITE_OPERATOR}</dd>
                </div>
                <div className={styles.contactRow}>
                  <dt className={styles.contactLabel}>공식 채널</dt>
                  <dd className={styles.contactValue}>
                    <a
                      href={SITE_DISCORD_SERVER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.inlineLink}
                    >
                      공식 채널 바로가기
                    </a>
                  </dd>
                </div>
              </dl>
              {footerHtml && (
                <div
                  className={styles.legalFooter}
                  dangerouslySetInnerHTML={{ __html: footerHtml }}
                />
              )}
            </section>
          </TertiarySection>
        </Column>
      </Scroll>
    </Page>
  );
}
