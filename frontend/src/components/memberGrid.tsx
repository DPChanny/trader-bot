import { MemberCard } from "./memberCard";
import { Section } from "@/components/commons/section";
import { Loading } from "@/components/commons/loading";
import { clsx } from "clsx";
import styles from "@/styles/components/memberGrid.module.css";
import type { MemberDTO } from "@/dtos/memberDto";
import { useGuildContext } from "@/contexts/guildContext";
import { useMemberPageContext } from "@/pages/member/memberContext";
import { useMembers } from "@/hooks/member";

interface MemberGridProps {
  /** Controlled mode: provide members + click handler (e.g. preset page). */
  members?: MemberDTO[];
  onMemberClick?: (memberId: number) => void;
  selectedMemberId?: number | null;
  className?: string;
}

export function MemberGrid({
  members: propMembers,
  onMemberClick: propOnClick,
  selectedMemberId: propSelectedId,
  className,
}: MemberGridProps) {
  const { guildId } = useGuildContext();

  // Contexts are only consumed in default (member-page) mode.
  // When running in controlled mode the page might not have a MemberPageProvider,
  // so we try/catch-style with a fallback at context level — but since the contexts
  // always return default values when no provider is present, this is safe.
  const memberPageCtx = useMemberPageContext();

  const { data: fetchedMembers, isLoading } = useMembers(
    propMembers === undefined ? guildId : null,
  );

  const members = propMembers ?? fetchedMembers ?? [];
  const selectedMemberId =
    propSelectedId !== undefined
      ? propSelectedId
      : memberPageCtx.selectedMemberId;
  const handleClick =
    propOnClick ?? ((id: number) => memberPageCtx.setSelectedMemberId(id));

  if (propMembers === undefined && isLoading) {
    return <Loading />;
  }

  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(styles.grid, className)}
    >
      {members.map((member) => (
        <div
          key={member.memberId}
          className={styles.gridItem}
          onClick={() => handleClick(member.memberId)}
        >
          <MemberCard
            member={member}
            isActive={selectedMemberId === member.memberId}
          />
        </div>
      ))}
    </Section>
  );
}
