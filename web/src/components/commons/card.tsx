import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/card.module.css";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
  type SectionProps,
} from "./section";

type CardVariantProps = VariantProps<typeof cardVariants>;

const cardVariants = cva(styles.card, {
  variants: {
    variantColor: {
      blue: styles.colorBlue,
      gold: styles.colorGold,
      green: styles.colorGreen,
      gray: styles.colorGray,
    },
    variantLayout: {
      column: styles.layoutColumn,
      row: styles.layoutRow,
    },
  },
  defaultVariants: {
    variantColor: "blue",
    variantLayout: "column",
  },
});

export type CardProps = SectionProps & {
  variantColor?: CardVariantProps["variantColor"];
  variantLayout?: CardVariantProps["variantLayout"];
};

export type ButtonCardProps = CardProps & {
  disabled?: boolean;
};

export type ToggleCardProps = ButtonCardProps & {
  isActive?: boolean;
};

function resolveSectionComponent(
  variantIntent?: SectionProps["variantIntent"],
) {
  if (variantIntent === "secondary") return SecondarySection;
  if (variantIntent === "tertiary") return TertiarySection;
  return PrimarySection;
}

export function Card({
  variantColor = "blue",
  variantLayout = "column",
  variantIntent,
  className,
  children,
  ...props
}: CardProps) {
  const SectionComponent = resolveSectionComponent(variantIntent);

  return (
    <SectionComponent
      className={clsx(cardVariants({ variantColor, variantLayout }), className)}
      {...props}
    >
      {children}
    </SectionComponent>
  );
}

export function ButtonCard({
  disabled = false,
  className,
  ...props
}: ButtonCardProps) {
  return (
    <Card
      className={clsx(
        styles.buttonCard,
        disabled && styles.buttonCardDisabled,
        className,
      )}
      aria-disabled={disabled || undefined}
      {...props}
    />
  );
}

export function ToggleCard({
  isActive = false,
  className,
  ...props
}: ToggleCardProps) {
  return (
    <ButtonCard
      className={clsx(isActive && styles.activeTrue, className)}
      {...props}
    />
  );
}
