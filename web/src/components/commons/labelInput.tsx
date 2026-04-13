import { Input, type InputProps } from "@/components/commons/input";
import { Label } from "@/components/commons/label";
import { Section } from "./section";

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
    <Section variantTone="ghost" variantIntent="tertiary">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      <Input {...inputProps} />
    </Section>
  );
}
