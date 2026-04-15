import { Input, type InputProps } from "@/app/components/atoms/input";
import { Label } from "@/app/components/atoms/label";
import { Column } from "@/app/components/atoms/layout";

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
