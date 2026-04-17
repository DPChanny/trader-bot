import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/splitLayout.module.css";

type SplitLayoutProps = {
  children: ComponentChildren;
  className?: string;
};

export function SplitLayout({ children, className }: SplitLayoutProps) {
  return <div className={clsx(styles.grid, className)}>{children}</div>;
}
