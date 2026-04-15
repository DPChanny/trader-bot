import { clsx } from "clsx";
import styles from "@styles/components/atoms/text.module.css";
import type { ComponentChildren, JSX } from "preact";

type SpanProps = JSX.IntrinsicElements["span"] & {
  children?: ComponentChildren;
  truncate?: boolean;
};

export type LabelProps = JSX.IntrinsicElements["label"] & {
  children?: ComponentChildren;
  required?: boolean;
  truncate?: boolean;
};

type HeadingProps = JSX.IntrinsicElements["h3"] & {
  children?: ComponentChildren;
  truncate?: boolean;
};

function withTruncate(className: SpanProps["className"], truncate?: boolean) {
  return clsx(className, truncate && styles.truncate);
}

export function Text({ className, truncate, ...props }: SpanProps) {
  return <span className={withTruncate(className, truncate)} {...props} />;
}

export function Title({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.title, className), truncate)}
      {...props}
    />
  );
}

export function TitleSm({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.titleSm, className), truncate)}
      {...props}
    />
  );
}

export function Body({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.body, className), truncate)}
      {...props}
    />
  );
}

export function BodyStrong({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.bodyStrong, className), truncate)}
      {...props}
    />
  );
}

export function HeadingTitle({ className, truncate, ...props }: HeadingProps) {
  return (
    <h3
      className={withTruncate(clsx(styles.title, className), truncate)}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  required,
  truncate,
  ...props
}: LabelProps) {
  return (
    <label
      className={withTruncate(clsx(styles.label, className), truncate)}
      {...props}
    >
      {children}
      {required && <span className={styles.labelRequired}> *</span>}
    </label>
  );
}

export function Eyebrow({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.eyebrow, className), truncate)}
      {...props}
    />
  );
}

export function Metric({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.metric, className), truncate)}
      {...props}
    />
  );
}

export function Caption({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.caption, className), truncate)}
      {...props}
    />
  );
}

export function CaptionStrong({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.captionStrong, className), truncate)}
      {...props}
    />
  );
}

export function BodyRelaxed({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.bodyRelaxed, className), truncate)}
      {...props}
    />
  );
}

export function Micro({ className, truncate, ...props }: SpanProps) {
  return (
    <span
      className={withTruncate(clsx(styles.micro, className), truncate)}
      {...props}
    />
  );
}
