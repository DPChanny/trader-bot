import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { PrimarySection, SecondarySection } from "../surfaces/section";
import type { ComponentChildren } from "preact";
import type { MarkedBlock, MarkedSection } from "@utils/marked";
import { GUILD_INVITE_URL, SITE_OPERATOR } from "@utils/env";
import { Link } from "@components/atoms/link";

export type MarkedPageProps = {
  title: ComponentChildren;
  intro: ComponentChildren;
  effectiveDate?: string;
  sections: MarkedSection[];
};

export function MarkedPage({
  title,
  intro,
  effectiveDate,
  sections,
}: MarkedPageProps) {
  const renderBlocks = (blocks: MarkedBlock[]) => (
    <Column gap="md">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Text key={index} align="start">
              {block.text}
            </Text>
          );
        }

        return (
          <Column key={index} gap="sm">
            {block.items.map((item) => (
              <Text key={item} align="start">
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
          <PrimarySection>
            <Column gap="md">
              <Title as="h1" variantSize="hero" align="start">
                {title}
              </Title>
              <Text align="start">{intro}</Text>
              <Row>
                <Fill center>
                  <Text>{`${SITE_OPERATOR} 작성`}</Text>
                </Fill>
                <Fill center>
                  <Text>
                    {effectiveDate ? `시행일 ${effectiveDate}` : undefined}
                  </Text>
                </Fill>
                <Fill center>
                  <Link
                    href={GUILD_INVITE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    문의하기
                  </Link>
                </Fill>
              </Row>
            </Column>
          </PrimarySection>

          <SecondarySection gap="md">
            <Column gap="xl">
              {sections.map((section) => (
                <Column key={section.title} gap="md">
                  <Title as="h2" align="start">
                    {section.title}
                  </Title>
                  {renderBlocks(section.blocks)}
                </Column>
              ))}
            </Column>
          </SecondarySection>
        </Column>
      </Scroll>
    </Page>
  );
}
