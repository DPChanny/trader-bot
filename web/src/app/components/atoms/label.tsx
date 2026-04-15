import { clsx } from "clsx";
import styles from "@/app/styles/components/atoms/label.module.css";
import type { ComponentChildren, JSX } from "preact";

export type LabelProps = JSX.IntrinsicElements["label"] & {
  children?: ComponentChildren;
  required?: boolean;
};

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label className={clsx(styles.label, className)} {...props}>
      {children}
      {required && <span className={styles.required}> *</span>}
    </label>
  );
}
