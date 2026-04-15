import { Input, type InputProps } from "../atoms/input";
import { Label } from "../atoms/label";
import { Column } from "../atoms/layout";

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
      <Input {...inputProps} />
    </Column>
  );
}
