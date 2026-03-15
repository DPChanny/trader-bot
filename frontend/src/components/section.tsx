import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/section.module.css";

const sectionVariants = cva(styles.section, {
  variants: {
    variantType: {
      primary: styles.typePrimary,
      secondary: styles.typeSecondary,
      tertiary: styles.typeTertiary,
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
    variantType: "primary",
    variantTone: "solid",
    variantLayout: "column",
  },
});

interface SectionProps extends VariantProps<typeof sectionVariants> {
  children: any;
  variantType?: "primary" | "secondary" | "tertiary";
  variantTone?: "solid" | "ghost";
  variantLayout?: "column" | "row" | "grid";
  className?: string;
}

export function Section({
  children,
  variantType = "primary",
  variantTone = "solid",
  variantLayout = "column",
  className,
}: SectionProps) {
  return (
    <div
      className={clsx(
        sectionVariants({ variantType, variantTone, variantLayout }),
        className,
      )}
    >
      {children}
    </div>
  );
}
