import { Column, Fill } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
import { Text } from "@components/atoms/text";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <SecondarySection>
      <Column fill center>
        <Text variantWeight="bold">{label}</Text>
        <Fill center>
          {children ? (
            children
          ) : (
            <Text variantWeight="bold" variantSize="large">
              {value}
            </Text>
          )}
        </Fill>
      </Column>
    </SecondarySection>
  );
}
