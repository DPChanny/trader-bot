import { Column, Page, Scroll } from "@components/atoms/layout";
import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/infoPage.module.css";

type InfoPageProps = {
  children: ComponentChildren;
  className?: string;
};

export function InfoPage({ children, className }: InfoPageProps) {
  return (
    <Page className={styles.pageShell}>
      <Scroll axis="y" className={styles.pageScroll}>
        <Column gap="xl" className={clsx(styles.container, className)}>
          {children}
        </Column>
      </Scroll>
    </Page>
  );
}
