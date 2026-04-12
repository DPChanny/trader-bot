import { Role } from "@/dtos/memberDto";
import type { MemberDTO } from "@/dtos/memberDto";
import { useMyMember } from "@/hooks/member";

export function hasRole(
  member: MemberDTO | null | undefined,
  required: Role,
): boolean {
  return (member?.role ?? Role.VIEWER) >= required;
}

export function useHasRole(guildId: string, required: Role): boolean {
  const { data: myMember } = useMyMember(guildId);
  return hasRole(myMember, required);
}
