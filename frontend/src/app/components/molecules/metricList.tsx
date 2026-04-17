import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/metricList.module.css";

type MetricItem = {
  label: string;
  value: ComponentChildren;
};

type MetricListProps = {
  items: MetricItem[];
  className?: string;
};

export function MetricList({ items, className }: MetricListProps) {
  return (
    <dl className={clsx(styles.grid, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.card}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
