import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/commons/section.module.css";
import type { HTMLAttributes } from "preact";

const sectionVariants = cva(styles.section, {
  variants: {
    variantIntent: {
      primary: styles.intentPrimary,
      secondary: styles.intentSecondary,
      tertiary: styles.intentTertiary,
    },
  },
  defaultVariants: {
    variantIntent: "primary",
  },
});

type SectionVariants = VariantProps<typeof sectionVariants>;

interface SectionProps extends SectionVariants, HTMLAttributes<HTMLDivElement> {
  children?: any;
  variantIntent?: "primary" | "secondary" | "tertiary";
  className?: string;
}

type SurfaceSectionProps = Omit<SectionProps, "variantIntent">;

export type { SectionProps, SurfaceSectionProps };

export function Section({
  children,
  variantIntent = "primary",
  className,
  ...props
}: SectionProps) {
  return (
    <div
      className={clsx(sectionVariants({ variantIntent }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PrimarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="primary" {...props} />;
}

export function SecondarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="secondary" {...props} />;
}

export function TertiarySection(props: SurfaceSectionProps) {
  return <Section variantIntent="tertiary" {...props} />;
}
