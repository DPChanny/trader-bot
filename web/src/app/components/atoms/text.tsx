import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@styles/components/atoms/text.module.css";
import type { ComponentChildren, JSX } from "preact";

const textVariants = cva("", {
  variants: {
    variantFont: {
      plain: "",
      relaxed: styles.fontRelaxed,
      eyebrow: styles.fontEyebrow,
    },
    variantWeight: {
      normal: styles.weightNormal,
      medium: styles.weightMedium,
      semibold: styles.weightSemibold,
      bold: styles.weightBold,
    },
    variantSize: {
      micro: styles.sizeMicro,
      xs: styles.sizeXs,
      sm: styles.sizeSm,
      base: styles.sizeBase,
      xl: styles.sizeXl,
      "3xl": styles.size3xl,
    },
    truncate: {
      true: styles.truncate,
      false: "",
    },
  },
  defaultVariants: {
    variantFont: "plain",
    variantWeight: "normal",
    variantSize: "base",
    truncate: false,
  },
});

type TextProps = JSX.IntrinsicElements["span"] &
  VariantProps<typeof textVariants> & {
    children?: ComponentChildren;
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

function withTruncate(
  className: JSX.IntrinsicElements["span"]["className"],
  truncate?: boolean,
) {
  return clsx(className, truncate && styles.truncate);
}

export function Text({
  className,
  variantFont,
  variantWeight,
  variantSize,
  truncate,
  ...props
}: TextProps) {
  return (
    <span
      className={clsx(
        textVariants({
          variantFont,
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

export function Title({ className, truncate, ...props }: HeadingProps) {
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
