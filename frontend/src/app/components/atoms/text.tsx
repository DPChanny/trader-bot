import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@styles/components/atoms/text.module.css";
import type { JSX } from "preact";

const textVariants = cva("", {
  variants: {
    variantWeight: {
      normal: styles.weightNormal,
      semibold: styles.weightSemibold,
      bold: styles.weightBold,
    },
    variantSize: {
      small: styles.sizeSmall,
      medium: styles.sizeMedium,
      large: styles.sizeLarge,
    },
    truncate: {
      true: styles.truncate,
      false: "",
    },
  },
  defaultVariants: {
    variantWeight: "normal",
    variantSize: "medium",
    truncate: false,
  },
});

type TextProps = JSX.IntrinsicElements["span"] &
  VariantProps<typeof textVariants>;

export type LabelProps = JSX.IntrinsicElements["label"] & {
  required?: boolean;
};

type TitleProps = JSX.IntrinsicElements["h3"] & {
  truncate?: boolean;
};

export function Text({
  className,
  variantWeight,
  variantSize,
  truncate,
  ...props
}: TextProps) {
  return (
    <span
      className={clsx(
        styles.text,
        textVariants({
          variantWeight,
          variantSize,
          truncate,
        }),
        className,
      )}
      {...props}
    />
  );
}

export function Name({ ...props }: TextProps) {
  return <Text variantWeight="semibold" truncate {...props} />;
}

export function Title({ className, truncate, ...props }: TitleProps) {
  return (
    <h3
      className={clsx(styles.title, className, truncate && styles.truncate)}
      {...props}
    />
  );
}

export function NameTitle({ ...props }: TitleProps) {
  return <Title truncate {...props} />;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label className={clsx(styles.label, className)} {...props}>
      {children}
      {required && <span className={styles.labelRequired}> *</span>}
    </label>
  );
}
