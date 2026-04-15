import { Column, Fill } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
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
        <Eyebrow>{label}</Eyebrow>
        <Fill center>{children ? children : <Metric>{value}</Metric>}</Fill>
      </Column>
    </SecondarySection>
  );
}
