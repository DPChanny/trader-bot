import type { JSX } from "preact";
import styles from "@/styles/components/page.module.css";

interface PageLayoutProps {
  children: JSX.Element | JSX.Element[] | null | undefined;
  className?: string;
}

interface PageContainerProps {
  children: JSX.Element | JSX.Element[] | null | undefined;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={`${styles.pageLayout} ${className || ""}`}>{children}</div>
  );
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={`${styles.pageContainer} ${className || ""}`}>
      {children}
    </div>
  );
}
