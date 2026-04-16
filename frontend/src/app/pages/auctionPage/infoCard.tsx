import { Fill } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { Card } from "@components/molecules/card";
import type { ComponentChildren } from "preact";

interface InfoCardProps {
  label: string;
  children: ComponentChildren;
}

export function InfoCard({ label, children }: InfoCardProps) {
  return (
    <Card fill center>
      <Text variantWeight="bold">{label}</Text>
      <Fill center>{children}</Fill>
    </Card>
  );
}
