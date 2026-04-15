import { Column, Fill } from "@/app/components/atoms/layout";
import { SecondarySection } from "@/app/components/molecules/section";
import styles from "@/app/styles/pages/auctionPage/infoCard.module.css";

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
