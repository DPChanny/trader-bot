import { Input, type InputProps } from "@/components/commons/input";
import { Label } from "@/components/commons/label";
import { Column } from "@/components/commons/layout";

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
