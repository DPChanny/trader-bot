import { Input, type InputProps } from "../atoms/input";
import { Label } from "../atoms/text";
import { Column } from "../atoms/layout";
import { TertiarySection } from "../surfaces/section";

export type LabelInputProps = InputProps & {
  label: string;
  required?: boolean;
};

export function LabelInput({
  label,
  required,
  ...inputProps
}: LabelInputProps) {
  return (
    <Column gap="xs">
      <Label required={required}>{label}</Label>
      <TertiarySection>
        <Input {...inputProps} />
      </TertiarySection>
    </Column>
  );
}
