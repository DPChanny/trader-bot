import { Column, Fill } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
import styles from "@styles/pages/auctionPage/infoCard.module.css";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <SecondarySection>
      <Column fill center>
        <span className={styles.infoLabel}>{label}</span>
        <Fill center className={styles.valueSection}>
          {children ? (
            children
          ) : (
            <span className={styles.infoValue}>{value}</span>
          )}
        </Fill>
      </Column>
    </SecondarySection>
  );
}
