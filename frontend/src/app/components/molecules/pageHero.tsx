import { Row } from "@components/atoms/layout";
import { PrimarySection } from "@components/molecules/section";
import { clsx } from "clsx";
import type { ComponentChildren } from "preact";
import styles from "@styles/components/molecules/pageHero.module.css";

type PageHeroProps = {
  eyebrow: string;
  title: ComponentChildren;
  description: ComponentChildren;
  meta?: ComponentChildren;
  actions?: ComponentChildren;
  children?: ComponentChildren;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <PrimarySection className={clsx(styles.heroSection, className)}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {meta && <p className={styles.meta}>{meta}</p>}
      </header>
      {actions && (
        <Row gap="md" wrap className={styles.actions}>
          {actions}
        </Row>
      )}
      {children}
    </PrimarySection>
  );
}
