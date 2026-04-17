import { Link } from "@components/atoms/link";
import { Column, Page, Row, Scroll } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { Card } from "./card";
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
    <Page>
      <Scroll axis="y">
        <Column gap="xl" className={styles.container}>
          <PrimarySection gap="lg" className={styles.heroSection}>
            <header>
              <Column gap="md">
                <Text
                  variantSize="small"
                  variantWeight="bold"
                  className={styles.eyebrow}
                >
                  {eyebrow}
                </Text>
                <h1 className={styles.heroTitle}>{title}</h1>
                <Text className={styles.heroDescription}>{intro}</Text>
                {meta && (
                  <Text variantSize="small" className={styles.meta}>
                    {meta}
                  </Text>
                )}
              </Column>
            </header>
            <Row gap="md" wrap>
              {heroActions ?? <Link href="/">홈으로 돌아가기</Link>}
            </Row>
          </PrimarySection>

          <SecondarySection gap="md">
            <HtmlContent html={bodyHtml} />
          </SecondarySection>

          {(supplementaryTitle ||
            supplementaryDescription ||
            supplementaryItems ||
            supplementaryContent ||
            footerHtml) && (
            <TertiarySection gap="md">
              {(supplementaryTitle || supplementaryDescription) && (
                <header>
                  <Column gap="sm">
                    {supplementaryTitle && (
                      <h2 className={styles.sectionTitle}>
                        {supplementaryTitle}
                      </h2>
                    )}
                    {supplementaryDescription && (
                      <Text className={styles.sectionDescription}>
                        {supplementaryDescription}
                      </Text>
                    )}
                  </Column>
                </header>
              )}

              {supplementaryItems && supplementaryItems.length > 0 && (
                <Column gap="md">
                  {supplementaryItems.map((item, index) => (
                    <Card key={index} variantColor="gray">
                      <Text variantSize="small" className={styles.infoLabel}>
                        {item.label}
                      </Text>
                      <Text
                        variantWeight="semibold"
                        className={styles.infoValue}
                      >
                        {item.value}
                      </Text>
                    </Card>
                  ))}
                </Column>
              )}

              {supplementaryContent}

              {footerHtml && (
                <HtmlContent html={footerHtml} variantTone="muted" />
              )}
            </TertiarySection>
          )}
        </Column>
      </Scroll>
    </Page>
  );
}
