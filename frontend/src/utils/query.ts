import { QueryClient } from "@tanstack/react-query";

export const queryStaleTimes = {
  interactive: 60 * 1000,
  default: 10 * 60 * 1000,
} as const;

export const queryKeys = {
  manifest: () => ["manifest"] as const,
  me: () => ["me"] as const,
  guilds: () => ["guilds"] as const,
  guild: (guildId: string) => ["guild", guildId] as const,
  presets: (guildId: string) => ["presets", guildId] as const,
  preset: (guildId: string, presetId: number) =>
    ["preset", guildId, presetId] as const,
  tiers: (guildId: string, presetId: number) =>
    ["tiers", guildId, presetId] as const,
  tier: (guildId: string, presetId: number, tierId: number) =>
    ["tier", guildId, presetId, tierId] as const,
  positions: (guildId: string, presetId: number) =>
    ["positions", guildId, presetId] as const,
  position: (guildId: string, presetId: number, positionId: number) =>
    ["position", guildId, presetId, positionId] as const,
  members: (guildId: string, search?: string) =>
    ["members", guildId, search ?? null] as const,
  myMember: (guildId: string) => ["member", guildId, "me"] as const,
  member: (guildId: string, memberId: number) =>
    ["member", guildId, memberId] as const,
  presetMembers: (guildId: string, presetId: number, search?: string) =>
    ["presetMembers", guildId, presetId, search ?? null] as const,
  presetMembersGuildScope: (guildId: string) =>
    ["presetMembers", guildId] as const,
  presetMember: (guildId: string, presetId: number, presetMemberId: number) =>
    ["presetMember", guildId, presetId, presetMemberId] as const,
  presetMemberPresetScope: (guildId: string, presetId: number) =>
    ["presetMember", guildId, presetId] as const,
  tierPresetScope: (guildId: string, presetId: number) =>
    ["tier", guildId, presetId] as const,
  positionPresetScope: (guildId: string, presetId: number) =>
    ["position", guildId, presetId] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: queryStaleTimes.default,
      gcTime: 10 * 60 * 1000,
      retry: false,
    },
  },
});
