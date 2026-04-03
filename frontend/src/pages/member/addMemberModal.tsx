import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: Event) => void;
  formData: {
    alias: string;
    riotId: string;
    discordId: string;
  };
  onFormChange: (field: string, value: string) => void;
  isPending: boolean;
  error?: Error | null;
}

export function AddMemberModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isPending,
  error,
}: AddMemberModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="멤버 추가">
      <ModalForm onSubmit={onSubmit}>
        {error && (
          <ErrorMessage detail={error?.message}>
            멤버 추가에 실패했습니다.
          </ErrorMessage>
        )}
        <LabelInput
          label="이름 (선택 사항)"
          type="text"
          value={formData.alias}
          onChange={(value) => onFormChange("alias", value)}
        />
        <LabelInput
          label="Riot ID (선택 사항)"
          type="text"
          value={formData.riotId}
          onChange={(value) => onFormChange("riotId", value)}
        />
        <LabelInput
          label="Discord ID (선택 사항)"
          type="text"
          value={formData.discordId}
          onChange={(value) => onFormChange("discordId", value)}
        />
        <ModalFooter>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
