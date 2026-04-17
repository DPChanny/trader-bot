import { Link } from "@components/atoms/link";
import { Column, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "./card";
import { PrimarySection, SecondarySection, TertiarySection } from "./section";
import type { ComponentChildren } from "preact";
import type { MarkedBlock, MarkedSection } from "@utils/marked";

export type MarkedPageProps = {
  eyebrow: ComponentChildren;
  title: ComponentChildren;
  intro: ComponentChildren;
  meta?: ComponentChildren;
  heroActions?: ComponentChildren;
  sections: MarkedSection[];
  footerBlocks?: MarkedBlock[];
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
  supplementaryTitle,
  supplementaryDescription,
  supplementaryItems,
  supplementaryContent,
  sections,
  footerBlocks,
}: MarkedPageProps) {
  const renderBlocks = (blocks: MarkedBlock[], tone: "default" | "muted") => (
    <Column gap="md">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Text
              key={index}
              as="p"
              block
              align="start"
              tone={tone}
              variantSize={tone === "muted" ? "small" : "medium"}
            >
              {block.text}
            </Text>
          );
        }

        return (
          <Column key={index} gap="sm">
            {block.items.map((item) => (
              <Text
                key={item}
                as="div"
                block
                align="start"
                tone={tone}
                variantSize={tone === "muted" ? "small" : "medium"}
              >
                {`• ${item}`}
              </Text>
            ))}
          </Column>
        );
      })}
    </Column>
  );

  return (
    <Page>
      <Scroll axis="y">
        <Column gap="xl" width="page" self="center">
          <PrimarySection gap="lg">
            <header>
              <Column gap="md" width="measure" align="start">
                <Text
                  as="div"
                  block
                  align="start"
                  variantSize="small"
                  variantWeight="bold"
                  tone="accent"
                >
                  {eyebrow}
                </Text>
                <Title as="h1" variantSize="hero" align="start">
                  {title}
                </Title>
                <Text as="p" block align="start">
                  {intro}
                </Text>
                {meta && (
                  <Text
                    as="p"
                    block
                    align="start"
                    variantSize="small"
                    tone="muted"
                  >
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
            <Column gap="xl">
              {sections.map((section) => (
                <Column key={section.title} gap="md">
                  <Title as="h2" align="start" variantSize="medium">
                    {section.title}
                  </Title>
                  {renderBlocks(section.blocks, "default")}
                </Column>
              ))}
            </Column>
          </SecondarySection>

          {(supplementaryTitle ||
            supplementaryDescription ||
            supplementaryItems ||
            supplementaryContent ||
            footerBlocks) && (
            <TertiarySection gap="md">
              {(supplementaryTitle || supplementaryDescription) && (
                <header>
                  <Column gap="sm" align="start">
                    {supplementaryTitle && (
                      <Title as="h2" align="start" variantSize="medium">
                        {supplementaryTitle}
                      </Title>
                    )}
                    {supplementaryDescription && (
                      <Text as="p" block align="start">
                        {supplementaryDescription}
                      </Text>
                    )}
                  </Column>
                </header>
              )}

              {supplementaryItems && supplementaryItems.length > 0 && (
                <Column gap="md">
                  {supplementaryItems.map((item, index) => (
                    <Card key={index} variantColor="gray" align="start">
                      <Text
                        as="div"
                        block
                        align="start"
                        variantSize="small"
                        tone="muted"
                      >
                        {item.label}
                      </Text>
                      <Text
                        as="div"
                        block
                        align="start"
                        variantWeight="semibold"
                      >
                        {item.value}
                      </Text>
                    </Card>
                  ))}
                </Column>
              )}

              {supplementaryContent}

              {footerBlocks && renderBlocks(footerBlocks, "muted")}
            </TertiarySection>
          )}
        </Column>
      </Scroll>
    </Page>
  );
}
