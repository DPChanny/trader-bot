import { useAddPresetMember } from "@/hooks/presetMember";
import { MemberGrid } from "@/components/memberGrid";
import { Error } from "@/components/commons/error";
import type { MemberDetailDTO } from "@/dtos/memberDto";

interface MemberCandidateGridProps {
  guildId: string;
  presetId: number;
  members: MemberDetailDTO[];
  addingMemberIds: Set<number>;
  addMemberIdToAdding: (memberId: number) => void;
  removeMemberIdFromAdding: (memberId: number) => void;
}

export function MemberCandidateGrid({
  guildId,
  presetId,
  members,
  addMemberIdToAdding,
  removeMemberIdFromAdding,
}: MemberCandidateGridProps) {
  const addPresetMember = useAddPresetMember();

  const handleClick = async (memberId: number) => {
    addMemberIdToAdding(memberId);
    try {
      await addPresetMember.mutateAsync({
        guildId,
        presetId,
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
