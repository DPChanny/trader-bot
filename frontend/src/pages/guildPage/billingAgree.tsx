import { Row } from "@components/atoms/layout";
import { InternalLink } from "@components/atoms/link";

interface BillingAgreeProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BillingAgree({ id, checked, onChange }: BillingAgreeProps) {
  return (
    <Row align="center" justify="center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} style={{ fontSize: "0.75rem", cursor: "pointer" }}>
        자동 결제에 동의합니다. (
        <InternalLink to="/terms-of-service">이용약관</InternalLink>)
      </label>
    </Row>
  );
}
