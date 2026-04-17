import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/contentList.module.css";

type ContentListProps = {
  items: ComponentChildren[];
  ordered?: boolean;
  className?: string;
};

export function ContentList({
  items,
  ordered = false,
  className,
}: ContentListProps) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={clsx(styles.list, className)}>
      {items.map((item, index) => (
        <li key={index} className={styles.item}>
          {item}
        </li>
      ))}
    </Tag>
  );
}
