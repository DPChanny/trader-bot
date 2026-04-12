import { QueryClient } from "@tanstack/preact-query";

export const queryKeys = {
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
  members: (guildId: string) => ["members", guildId] as const,
  myMember: (guildId: string) => ["members", guildId, "me"] as const,
  member: (guildId: string, memberId: number) =>
    ["members", guildId, memberId] as const,
  presetMembers: (guildId: string, presetId: number) =>
    ["presetMembers", guildId, presetId] as const,
  presetMembersByGuild: (guildId: string) =>
    ["presetMembers", guildId] as const,
  presetMember: (guildId: string, presetId: number, presetMemberId: number) =>
    ["presetMember", guildId, presetId, presetMemberId] as const,
  presetMemberAll: (guildId: string, presetId: number) =>
    ["presetMember", guildId, presetId] as const,
  tierAll: (guildId: string, presetId: number) =>
    ["tier", guildId, presetId] as const,
  positionAll: (guildId: string, presetId: number) =>
    ["position", guildId, presetId] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
