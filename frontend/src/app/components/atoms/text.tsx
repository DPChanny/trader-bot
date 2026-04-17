import { clsx } from "clsx";
import { cva, type VariantProps } from "class-variance-authority";
import styles from "@styles/components/atoms/text.module.css";
import type { JSX } from "preact";

const textVariants = cva("", {
  variants: {
    block: {
      true: styles.displayBlock,
      false: "",
    },
    align: {
      start: styles.alignStart,
      center: styles.alignCenter,
      end: styles.alignEnd,
    },
    tone: {
      default: styles.toneDefault,
      muted: styles.toneMuted,
      accent: styles.toneAccent,
    },
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
    block: false,
    align: "center",
    tone: "default",
    variantWeight: "normal",
    variantSize: "medium",
    truncate: false,
  },
});

const titleVariants = cva(styles.title, {
  variants: {
    align: {
      start: styles.alignStart,
      center: styles.alignCenter,
      end: styles.alignEnd,
    },
    variantSize: {
      medium: styles.titleMedium,
      large: styles.titleLarge,
      hero: styles.titleHero,
    },
  },
  defaultVariants: {
    align: "center",
    variantSize: "medium",
  },
});

type TextProps = JSX.IntrinsicElements["span"] &
  VariantProps<typeof textVariants>;

export type LabelProps = JSX.IntrinsicElements["label"] & {
  required?: boolean;
};

type TitleProps = JSX.IntrinsicElements["h3"] & {
  as?: "h1" | "h2" | "h3";
  align?: VariantProps<typeof titleVariants>["align"];
  variantSize?: VariantProps<typeof titleVariants>["variantSize"];
  truncate?: boolean;
};

export function Text({
  className,
  align,
  tone,
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
          align,
          tone,
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

export function Title({
  as: Component = "h3",
  className,
  align,
  variantSize,
  truncate,
  ...props
}: TitleProps) {
  return (
    <Component
      className={clsx(
        titleVariants({ align, variantSize }),
        className,
        truncate && styles.truncate,
      )}
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
