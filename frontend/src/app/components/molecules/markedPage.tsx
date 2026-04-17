import { Link } from "@components/atoms/link";
import { Column, Page, Scroll } from "@components/atoms/layout";
import { PrimarySection, SecondarySection, TertiarySection } from "./section";
import { HtmlContent } from "./htmlContent";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/markedPage.module.css";

export type MarkedPageProps = {
  eyebrow: ComponentChildren;
  title: ComponentChildren;
  intro: ComponentChildren;
  meta?: ComponentChildren;
  heroActions?: ComponentChildren;
  bodyHtml: string;
  footerHtml?: string;
  supplementaryTitle?: ComponentChildren;
  supplementaryDescription?: ComponentChildren;
  supplementaryItems?: Array<{
    label: ComponentChildren;
    value: ComponentChildren;
  }>;
  supplementaryContent?: ComponentChildren;
};

export function MarkedPage({
  eyebrow,
  title,
  intro,
  meta,
  heroActions,
  bodyHtml,
  footerHtml,
  supplementaryTitle,
  supplementaryDescription,
  supplementaryItems,
  supplementaryContent,
}: MarkedPageProps) {
  return (
    <Page className={styles.pageShell}>
      <Scroll axis="y" className={styles.pageScroll}>
        <Column gap="xl" className={styles.container}>
          <PrimarySection className={styles.heroSection}>
            <header className={styles.heroHeader}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.heroTitle}>{title}</h1>
              <p className={styles.heroDescription}>{intro}</p>
              {meta && <p className={styles.meta}>{meta}</p>}
            </header>
            <div className={styles.heroActions}>
              {heroActions ?? <Link href="/">홈으로 돌아가기</Link>}
            </div>
          </PrimarySection>

          <SecondarySection className={styles.sectionShell}>
            <section className={styles.sectionBody}>
              <HtmlContent html={bodyHtml} />
            </section>
          </SecondarySection>

          {(supplementaryContent || footerHtml) && (
            <TertiarySection className={styles.sectionShell}>
              <section className={styles.sectionBody}>
                {(supplementaryTitle || supplementaryDescription) && (
                  <header className={styles.sectionHeader}>
                    {supplementaryTitle && (
                      <h2 className={styles.sectionTitle}>
                        {supplementaryTitle}
                      </h2>
                    )}
                    {supplementaryDescription && (
                      <p className={styles.sectionDescription}>
                        {supplementaryDescription}
                      </p>
                    )}
                  </header>
                )}

                {supplementaryItems && (
                  <dl className={styles.infoList}>
                    {supplementaryItems.map((item, index) => (
                      <div key={index} className={styles.infoRow}>
                        <dt className={styles.infoLabel}>{item.label}</dt>
                        <dd className={styles.infoValue}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {supplementaryContent}

                {footerHtml && (
                  <HtmlContent html={footerHtml} variantTone="muted" />
                )}
              </section>
            </TertiarySection>
          )}
        </Column>
      </Scroll>
    </Page>
  );
}
