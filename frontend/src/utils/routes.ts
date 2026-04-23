function staticRoute<T extends string>(pattern: T) {
  return { pattern, to: pattern } as const;
}

function dynamicRoute<T extends string, TArgs extends unknown[]>(
  pattern: T,
  build: (...args: TArgs) => string,
) {
  return { pattern, to: build } as const;
}

export const Routes = {
  home: staticRoute("/"),

  auth: {
    loginCallback: staticRoute("/auth/login/callback"),
  },

  patch: {
    ...staticRoute("/patch"),
    version: (version: string) =>
      `/patch?version=${encodeURIComponent(version)}`,
  },

  announcement: {
    ...staticRoute("/announcement"),
    id: (id: string) => `/announcement?id=${encodeURIComponent(id)}`,
  },

  termsOfService: staticRoute("/terms-of-service"),
  privacyPolicy: staticRoute("/privacy-policy"),

  guild: {
    member: dynamicRoute(
      "/guild/:guildId/member",
      (guildId: string) => `/guild/${guildId}/member`,
    ),
    preset: dynamicRoute(
      "/guild/:guildId/preset/:presetId",
      (guildId: string, presetId: number) =>
        `/guild/${guildId}/preset/${presetId}`,
    ),
    auction: dynamicRoute(
      "/guild/:guildId/preset/:presetId/auction/:auctionId",
      (guildId: string, presetId: number, auctionId: string) =>
        `/guild/${guildId}/preset/${presetId}/auction/${auctionId}`,
    ),
  },
} as const;
