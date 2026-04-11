import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@/styles/components/commons/page.module.css";

interface PageLayoutProps {
  children: ComponentChildren;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={clsx(styles.pageLayout, className)}>{children}</div>;
}
