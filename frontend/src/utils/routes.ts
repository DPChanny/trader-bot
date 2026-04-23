export function extractRouteParams(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart === undefined || pathPart === undefined) return null;

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}
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
      "/patch?version=" + encodeURIComponent(version),
  },

  announcement: {
    ...staticRoute("/announcement"),
    id: (id: string) => "/announcement?id=" + encodeURIComponent(id),
  },

  termsOfService: staticRoute("/terms-of-service"),
  privacyPolicy: staticRoute("/privacy-policy"),

  guild: {
    basePattern: "/guild/:guildId",
    presetBasePattern: "/guild/:guildId/preset/:presetId",
    member: dynamicRoute(
      "/guild/:guildId/member",
      (guildId: string) => "/guild/" + guildId + "/member",
    ),
    preset: dynamicRoute(
      "/guild/:guildId/preset/:presetId",
      (guildId: string, presetId: number) =>
        "/guild/" + guildId + "/preset/" + presetId,
    ),
    auction: dynamicRoute(
      "/guild/:guildId/preset/:presetId/auction/:auctionId",
      (guildId: string, presetId: number, auctionId: string) =>
        "/guild/" + guildId + "/preset/" + presetId + "/auction/" + auctionId,
    ),
  },
} as const;
