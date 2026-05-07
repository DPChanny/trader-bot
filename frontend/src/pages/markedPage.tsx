import { Column, Page, Scroll } from "@components/atoms/layout";
import { PrimarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { useMarked } from "@hooks/public";
import styles from "@styles/pages/markedPage.module.css";

export type MarkedPageProps = {
  path: string;
};

export function MarkedPage({ path }: MarkedPageProps) {
  const markedQuery = useMarked(path);
  const html = markedQuery.data ?? "";

  return (
    <Page>
      <Scroll>
        <Column align="center" style={{ minHeight: "100%" }}>
          <PrimarySection width="page" style={{ flex: 1 }}>
            <div
              className={styles.markedContent}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </PrimarySection>
          <Footer />
        </Column>
      </Scroll>
    </Page>
  );
}
