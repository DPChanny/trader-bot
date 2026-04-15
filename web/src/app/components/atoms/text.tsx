import { clsx } from "clsx";
import styles from "@styles/components/atoms/text.module.css";
import type { ComponentChildren, JSX } from "preact";

type SpanProps = JSX.IntrinsicElements["span"] & {
  children?: ComponentChildren;
};

export type LabelProps = JSX.IntrinsicElements["label"] & {
  children?: ComponentChildren;
  required?: boolean;
};

type HeadingProps = JSX.IntrinsicElements["h3"] & {
  children?: ComponentChildren;
};

export function Title({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.title, className)} {...props} />;
}

export function TitleSm({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.titleSm, className)} {...props} />;
}

export function Body({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.body, className)} {...props} />;
}

export function BodyStrong({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.bodyStrong, className)} {...props} />;
}

export function HeadingTitle({ className, ...props }: HeadingProps) {
  return <h3 className={clsx(styles.title, className)} {...props} />;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label className={clsx(styles.label, className)} {...props}>
      {children}
      {required && <span className={styles.labelRequired}> *</span>}
    </label>
  );
}

export function Eyebrow({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.eyebrow, className)} {...props} />;
}

export function Metric({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.metric, className)} {...props} />;
}

export function Caption({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.caption, className)} {...props} />;
}

export function CaptionStrong({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.captionStrong, className)} {...props} />;
}

export function BodyRelaxed({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.bodyRelaxed, className)} {...props} />;
}

export function Micro({ className, ...props }: SpanProps) {
  return <span className={clsx(styles.micro, className)} {...props} />;
}
