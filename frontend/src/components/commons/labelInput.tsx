import { Input, type InputProps } from "@/components/commons/input";
import { Label } from "@/components/commons/label";
import { Section } from "./section";

type LabelInputProps = InputProps & {
  label: string;
  htmlFor?: string;
};

export function LabelInput({ label, htmlFor, ...inputProps }: LabelInputProps) {
  return (
    <Section variantTone="ghost" variantIntent="tertiary">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Input {...inputProps} />
    </Section>
  );
}
