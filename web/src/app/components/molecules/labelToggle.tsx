import { Column } from "../atoms/layout";
import { Label } from "../atoms/text";
import { TertiarySection } from "./section";
import { Toggle, type ToggleProps } from "./toggle";

export type LabelToggleProps = ToggleProps & {
  label: string;
  required?: boolean;
};

export function LabelToggle({
  label,
  required,
  ...toggleProps
}: LabelToggleProps) {
  return (
    <Column gap="xs">
      <Label required={required}>{label}</Label>
      <TertiarySection>
        <Toggle {...toggleProps} />
      </TertiarySection>
    </Column>
  );
}
