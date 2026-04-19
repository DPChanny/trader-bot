import { useEffect, useMemo, useState } from "preact/hooks";
import { marked } from "marked";
import { Column, Page, Scroll } from "@components/atoms/layout";
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

  const loader = useMemo(() => markedLoaders[path], [path]);

  useEffect(() => {
    let isActive = true;

    if (!loader) {
      setHtml("");
      return () => {
        isActive = false;
      };
    }

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

        setHtml("");
      });

    return () => {
      isActive = false;
    };
  }, [loader]);

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" minSize fill>
          <Scroll>
            <div
              className={styles.markedContent}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Scroll>
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
