import { Column, Fill } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
import styles from "@styles/pages/auctionPage/infoCard.module.css";
import { Eyebrow, Metric } from "@components/atoms/text";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <SecondarySection>
      <Column fill center>
        <Eyebrow className={styles.infoLabel}>{label}</Eyebrow>
        <Fill center className={styles.valueSection}>
          {children ? (
            children
          ) : (
            <Metric className={styles.infoValue}>{value}</Metric>
          )}
        </Fill>
      </Column>
    </SecondarySection>
  );
}
