import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/auctionPage/infoCard.module.css";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <Section variantIntent="secondary" className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <Section variantTone="ghost" className={styles.valueSection}>
        {children ? (
          children
        ) : (
          <span className={styles.infoValue}>{value}</span>
        )}
      </Section>
    </Section>
  );
}
