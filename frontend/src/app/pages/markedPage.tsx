import { useEffect, useMemo, useState } from "preact/hooks";
import { marked } from "marked";
import { Page, Scroll } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { PrimarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import styles from "@styles/pages/markedPage.module.css";

export type MarkedPageProps = {
  path: string;
};

const markedLoaders = import.meta.glob("/src/docs/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

export function MarkedPage({ path }: MarkedPageProps) {
  const [html, setHtml] = useState("");
  const [hasError, setHasError] = useState(false);

  const loader = useMemo(() => markedLoaders[path], [path]);

  useEffect(() => {
    let isActive = true;

    if (!loader) {
      setHasError(true);
      setHtml("");
      return () => {
        isActive = false;
      };
    }

    setHasError(false);
    loader()
      .then((markedSource) => {
        if (!isActive) {
          return;
        }

        const rendered = marked.parse(markedSource, {
          gfm: true,
          async: false,
        });
        setHtml(rendered);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setHasError(true);
        setHtml("");
      });

    return () => {
      isActive = false;
    };
  }, [loader]);

  return (
    <Page>
      <Scroll align="center">
        <PrimarySection width="page">
          {hasError && <Text align="start">문서를 불러오지 못했습니다.</Text>}
          {!hasError && (
            <div
              className={styles.markedContent}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </PrimarySection>
        <Footer />
      </Scroll>
    </Page>
  );
}
