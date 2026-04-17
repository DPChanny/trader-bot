import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/definitionList.module.css";

type DefinitionItem = {
  label: string;
  value: ComponentChildren;
};

type DefinitionListProps = {
  items: DefinitionItem[];
  className?: string;
};

export function DefinitionList({ items, className }: DefinitionListProps) {
  return (
    <dl className={clsx(styles.list, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
