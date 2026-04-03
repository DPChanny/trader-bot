import { Modal, ModalForm, ModalFooter } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";

interface AddTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  tierName: string;
  onNameChange: (value: string) => void;
  isPending?: boolean;
  error?: Error | null;
}

export function AddTierModal({
  isOpen,
  onClose,
  onSubmit,
  tierName,
  onNameChange,
  isPending = false,
  error,
}: AddTierModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="티어 추가">
      <ModalForm onSubmit={onSubmit}>
        {error && (
          <ErrorMessage detail={error?.message}>
            티어 추가에 실패했습니다.
          </ErrorMessage>
        )}
        <LabelInput
          label="티어 이름"
          type="text"
          value={tierName}
          onChange={onNameChange}
        />
        <ModalFooter>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !tierName.trim()}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
