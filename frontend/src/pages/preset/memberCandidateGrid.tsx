import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";
import { useMembers } from "@/hooks/member";
import { usePresetDetail } from "@/hooks/preset";
import { useAddPresetMember } from "@/hooks/presetMember";
import { MemberGrid } from "@/components/memberGrid";
import { Error } from "@/components/commons/error";

export function MemberCandidateGrid() {
  const { guildId } = useGuildContext();
  const {
    selectedPresetId,
    addingMemberIds,
    addMemberIdToAdding,
    removeMemberIdFromAdding,
  } = usePresetPageContext();
  const { data: members } = useMembers(guildId);
  const { data: presetDetail } = usePresetDetail(guildId, selectedPresetId);
  const addPresetMember = useAddPresetMember();

  const presetMemberIds = presetDetail
    ? new Set(presetDetail.presetMembers.map((pm) => pm.memberId))
    : new Set<number>();

  const candidateMembers =
    members?.filter(
      (m) =>
        !presetMemberIds.has(m.memberId) && !addingMemberIds.has(m.memberId),
    ) ?? [];

  const handleClick = async (memberId: number) => {
    if (!selectedPresetId || !guildId) return;
    addMemberIdToAdding(memberId);
    try {
      await addPresetMember.mutateAsync({
        guildId,
        presetId: selectedPresetId,
        dto: { memberId },
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
      <MemberGrid members={candidateMembers} onMemberClick={handleClick} />
    </>
  );
}
