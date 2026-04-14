import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/card.module.css";
import { Section, type SectionProps } from "./section";

type CardVariantProps = VariantProps<typeof cardVariants>;

const cardVariants = cva(styles.card, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variantActive: {
      true: styles.activeTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantActive: false,
  },
});

export type CardProps = SectionProps & {
  variantColor?: CardVariantProps["variantColor"];
  variantActive?: boolean;
};

export function Card({
  variantColor = "blue",
  variantActive = false,
  variantIntent,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Section
      variantIntent={variantIntent}
      className={clsx(cardVariants({ variantColor, variantActive }), className)}
      {...props}
    >
      {children}
    </Section>
  );
}
