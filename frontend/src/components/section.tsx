import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/section.module.css";

const sectionVariants = cva(styles.section, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      tertiary: styles.intentTertiary,
    },
    variantTone: {
      solid: styles.toneSolid,
      ghost: styles.toneGhost,
    },
    variantLayout: {
      column: styles.layoutColumn,
      row: styles.layoutRow,
      grid: styles.layoutGrid,
    },
  },
  defaultVariants: {
    variantIntent: "primary",
    variantTone: "solid",
    variantLayout: "column",
  },
});

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: any;
  variantIntent?: "primary" | "secondary" | "tertiary";
  variantTone?: "solid" | "ghost";
  variantLayout?: "column" | "row" | "grid";
  className?: string;
}

export function Section({
  children,
  variantIntent = "primary",
  variantTone = "solid",
  variantLayout = "column",
  className,
}: SectionProps) {
  return (
    <div
      className={clsx(
        sectionVariants({ variantIntent, variantTone, variantLayout }),
        className,
      )}
    >
      {children}
    </div>
  );
}
