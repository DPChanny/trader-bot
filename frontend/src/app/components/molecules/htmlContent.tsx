import { clsx } from "clsx";
import styles from "@styles/components/molecules/htmlContent.module.css";

type HtmlContentProps = {
  html: string;
  variantTone?: "default" | "muted";
  className?: string;
};

export function HtmlContent({
  html,
  variantTone = "default",
  className,
}: HtmlContentProps) {
  return (
    <div
      className={clsx(
        styles.richText,
        variantTone === "muted" && styles.muted,
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
