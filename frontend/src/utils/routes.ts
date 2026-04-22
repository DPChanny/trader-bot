export const Routes = {
  home: "/",

  auth: {
    loginCallback: "/auth/login/callback",
  },

  patch: {
    index: "/patch",
    version: (version: string) =>
      `/patch?version=${encodeURIComponent(version)}`,
  },

  announcement: {
    index: "/announcement",
    name: (name: string) => `/announcement?name=${encodeURIComponent(name)}`,
  },

  termsOfService: "/terms-of-service",
  privacyPolicy: "/privacy-policy",

  guild: {
    member: (guildId: string) => `/guild/${guildId}/member`,
    preset: (guildId: string, presetId: number) =>
      `/guild/${guildId}/preset/${presetId}`,
    auction: (guildId: string, presetId: number, auctionId: string) =>
      `/guild/${guildId}/preset/${presetId}/auction/${auctionId}`,
  },
} as const;

export const RoutePaths = {
  home: "/",
  auth: {
    loginCallback: "/auth/login/callback",
  },
  patch: "/patch",
  announcement: "/announcement",
  termsOfService: "/terms-of-service",
  privacyPolicy: "/privacy-policy",
  guild: {
    member: "/guild/:guildId/member",
    preset: "/guild/:guildId/preset/:presetId",
    auction: "/guild/:guildId/preset/:presetId/auction/:auctionId",
  },
} as const;
