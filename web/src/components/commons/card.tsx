import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/card.module.css";
import { Section, type SectionProps } from "./section";

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
  variantColor?: VariantProps<typeof cardVariants>["variantColor"];
  variantActive?: boolean;
};

export function Card({
  variantColor = "blue",
  variantActive = false,
  variantLayout = "column",
  variantIntent,
  variantTone,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Section
      variantIntent={variantIntent}
      variantTone={variantTone}
      variantLayout={variantLayout}
      className={clsx(cardVariants({ variantColor, variantActive }), className)}
      {...props}
    >
      {children}
    </Section>
  );
}
