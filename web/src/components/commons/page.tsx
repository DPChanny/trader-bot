import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import { Row } from "@/components/commons/layout";
import styles from "@/styles/components/commons/page.module.css";

interface PageLayoutProps {
  children?: ComponentChildren;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <Row
      fill
      minSize
      overflow="hidden"
      gap="lg"
      className={clsx(styles.pageLayout, className)}
    >
      {children}
    </Row>
  );
}
