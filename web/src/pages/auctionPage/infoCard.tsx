import { Column } from "@/components/commons/layout";
import { SecondarySection } from "@/components/commons/section";
import styles from "@/styles/pages/auctionPage/infoCard.module.css";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <SecondarySection className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <Column className={styles.valueSection}>
        {children ? (
          children
        ) : (
          <span className={styles.infoValue}>{value}</span>
        )}
      </Column>
    </SecondarySection>
  );
}
