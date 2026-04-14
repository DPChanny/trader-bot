import { Input, type InputProps } from "@/components/commons/input";
import { Label } from "@/components/commons/label";
import { Column } from "./layout";

type LabelInputProps = InputProps & {
  label: string;
  htmlFor?: string;
  required?: boolean;
};

export function LabelInput({
  label,
  htmlFor,
  required,
  ...inputProps
}: LabelInputProps) {
  return (
    <Column gap="xs">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      <Input {...inputProps} />
    </Column>
  );
}
