import { useEffect, useMemo, useState } from "preact/hooks";
import { Column, Page, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { SecondarySection } from "@components/surfaces/section";
import { parseMarkedDocument, type MarkedBlock } from "@utils/marked";

export type MarkedPageProps = {
  path: string;
};

const markdownLoaders = import.meta.glob("/src/docs/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export function MarkedPage({ path }: MarkedPageProps) {
  const [blocks, setBlocks] = useState<MarkedBlock[]>([]);
  const [hasError, setHasError] = useState(false);

  const loader = useMemo(() => markdownLoaders[path], [path]);

  useEffect(() => {
    let isActive = true;

    if (!loader) {
      setHasError(true);
      setBlocks([]);
      return () => {
        isActive = false;
      };
    }

    setHasError(false);
    loader()
      .then((markdown) => {
        if (!isActive) {
          return;
        }

        const document = parseMarkedDocument(markdown);
        setBlocks(document.blocks);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setHasError(true);
        setBlocks([]);
      });

    return () => {
      isActive = false;
    };
  }, [loader]);

  const renderBlock = (block: MarkedBlock, index: number) => {
    if (block.type === "heading") {
      if (block.depth <= 1) {
        return (
          <Title
            key={`${index}-${block.text}`}
            as="h1"
            variantSize="hero"
            align="start"
          >
            {block.text}
          </Title>
        );
      }

      if (block.depth === 2) {
        return (
          <Title key={`${index}-${block.text}`} as="h2" align="start">
            {block.text}
          </Title>
        );
      }

      return (
        <Title key={`${index}-${block.text}`} as="h3" align="start">
          {block.text}
        </Title>
      );
    }

    if (block.type === "paragraph") {
      return (
        <Text key={`${index}-${block.text}`} align="start">
          {block.text}
        </Text>
      );
    }

    return (
      <Column key={`${index}-list`} gap="sm">
        {block.items.map((item) => (
          <Text key={item} align="start">
            {`• ${item}`}
          </Text>
        ))}
      </Column>
    );
  };

  return (
    <Page>
      <Scroll axis="y">
        <Column gap="xl" width="page" self="center">
          <SecondarySection gap="md">
            <Column gap="md">
              {hasError && (
                <Text align="start">문서를 불러오지 못했습니다.</Text>
              )}
              {!hasError &&
                blocks.map((block, index) => renderBlock(block, index))}
            </Column>
          </SecondarySection>
        </Column>
      </Scroll>
    </Page>
  );
}
