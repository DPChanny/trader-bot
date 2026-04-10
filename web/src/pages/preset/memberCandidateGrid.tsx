import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";
import { useAddPresetMember } from "@/hooks/presetMember";
import { MemberGrid } from "@/components/memberGrid";
import { Error } from "@/components/commons/error";
import type { MemberDetailDTO } from "@/dtos/memberDto";

interface MemberCandidateGridProps {
  members: MemberDetailDTO[];
}

export function MemberCandidateGrid({ members }: MemberCandidateGridProps) {
  const { guild } = useGuildContext();
  const guildId = guild?.discordId ?? null;
  const { selectedPresetId, addMemberIdToAdding, removeMemberIdFromAdding } =
    usePresetPageContext();
  const addPresetMember = useAddPresetMember();

  const handleClick = async (memberId: number) => {
    if (!selectedPresetId || !guildId) return;
    addMemberIdToAdding(memberId);
    try {
      await addPresetMember.mutateAsync({
        guildId,
        presetId: selectedPresetId,
        dto: { memberId, tierId: null, isLeader: false },
      });
    } catch (err) {
      console.error("Failed to add member:", err);
      removeMemberIdFromAdding(memberId);
    }
  };

  return (
    <>
      {addPresetMember.isError && (
        <Error detail={addPresetMember.error?.message}>
          멤버를 프리셋에 추가하는데 실패했습니다.
        </Error>
      )}
      <MemberGrid members={members} onMemberClick={handleClick} />
    </>
  );
}
