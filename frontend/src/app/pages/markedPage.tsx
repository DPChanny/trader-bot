import { useEffect, useState } from "preact/hooks";
import { marked } from "marked";
import { Column, Page, Scroll } from "@components/atoms/layout";
import { PrimarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import styles from "@styles/pages/markedPage.module.css";

export type MarkedPageProps = {
  path: string;
};

export function MarkedPage({ path }: MarkedPageProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let isActive = true;

    fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load markdown");
        }
        return response.text();
      })
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
  }, [path]);

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
