import { Row } from "@components/atoms/layout";
import { PrimaryButton } from "@components/atoms/button";
import { Select } from "@components/atoms/select";
import type { BillingDTO } from "@features/billing/dto";

interface BillingSelectProps {
  billings: BillingDTO[];
  value: number | null;
  onChange: (billingId: number) => void;
  onAdd: () => void;
  disabled?: boolean;
}

export function BillingSelect({
  billings,
  value,
  onChange,
  onAdd,
  disabled,
}: BillingSelectProps) {
  if (!billings.length) {
    return (
      <PrimaryButton variantSize="small" onClick={onAdd} disabled={disabled}>
        결제 수단 추가
      </PrimaryButton>
    );
  }

  return (
    <Row gap="xs" align="center">
      <Select
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        variantSize="small"
        style={{ flex: 1 }}
      >
        {billings.map((b) => (
          <option key={b.billingId} value={String(b.billingId)}>
            {b.name || "카드"}
          </option>
        ))}
      </Select>
      <PrimaryButton
        variantSize="small"
        variantContent="icon"
        onClick={onAdd}
        disabled={disabled}
      >
        +
      </PrimaryButton>
    </Row>
  );
}
