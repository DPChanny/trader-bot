import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/pageSection.module.css";

type PageSectionProps = {
  title?: ComponentChildren;
  description?: ComponentChildren;
  actions?: ComponentChildren;
  children?: ComponentChildren;
  variantSurface?: "secondary" | "tertiary";
  className?: string;
};

export function PageSection({
  title,
  description,
  actions,
  children,
  variantSurface = "secondary",
  className,
}: PageSectionProps) {
  const Section =
    variantSurface === "tertiary" ? TertiarySection : SecondarySection;

  return (
    <Section className={clsx(styles.section, className)}>
      <section className={styles.body}>
        {(title || description) && (
          <header className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </header>
        )}
        {children}
        {actions && <div className={styles.actions}>{actions}</div>}
      </section>
    </Section>
  );
}
