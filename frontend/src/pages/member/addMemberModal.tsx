import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import { useAddMember } from "@/hooks/member";
import { useGuildContext } from "@/contexts/guildContext";
import { useMemberPageContext } from "./memberContext";

const INITIAL_STATE = { alias: "", riotId: "", discordId: "" };

export function AddMemberModal() {
  const { guildId } = useGuildContext();
  const { isModalOpen, closeModal } = useMemberPageContext();
  const [alias, setAlias] = useState(INITIAL_STATE.alias);
  const [riotId, setRiotId] = useState(INITIAL_STATE.riotId);
  const [discordId, setDiscordId] = useState(INITIAL_STATE.discordId);
  const addMember = useAddMember();

  const handleClose = () => {
    setAlias(INITIAL_STATE.alias);
    setRiotId(INITIAL_STATE.riotId);
    setDiscordId(INITIAL_STATE.discordId);
    addMember.reset();
    closeModal();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!guildId) return;
    try {
      await addMember.mutateAsync({
        guildId,
        dto: { alias, riotId, discordId },
      });
      handleClose();
    } catch {
      // error displayed in modal
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose} title="멤버 추가">
      <ModalForm onSubmit={handleSubmit}>
        {addMember.isError ? (
          <ErrorMessage detail={addMember.error.message}>
            멤버 추가에 실패했습니다.
          </ErrorMessage>
        ) : null}
        <LabelInput
          label="이름 (선택 사항)"
          type="text"
          value={alias}
          onChange={setAlias}
        />
        <LabelInput
          label="Riot ID (선택 사항)"
          type="text"
          value={riotId}
          onChange={setRiotId}
        />
        <LabelInput
          label="Discord ID (선택 사항)"
          type="text"
          value={discordId}
          onChange={setDiscordId}
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={addMember.isPending}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
