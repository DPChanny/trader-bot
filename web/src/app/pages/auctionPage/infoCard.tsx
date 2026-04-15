import { Column, Fill } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { Card } from "@components/atoms/card";

interface InfoCardProps {
  label: string;
  value: string | number;
  children?: any;
}

export function InfoCard({ label, value, children }: InfoCardProps) {
  return (
    <Card>
      <Column center>
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
    </Card>
  );
}
