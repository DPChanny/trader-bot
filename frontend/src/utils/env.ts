const API_ORIGIN = import.meta.env["VITE_API_ORIGIN"];
const WS_ORIGIN = import.meta.env["VITE_WS_ORIGIN"];

const API_ENDPOINT = `${API_ORIGIN}/api`;
const WS_ENDPOINT = `${WS_ORIGIN}/ws`;

export const AUTH_API_ENDPOINT = `${API_ENDPOINT}/auth`;
export const USER_API_ENDPOINT = `${API_ENDPOINT}/user`;
export const GUILD_API_ENDPOINT = `${API_ENDPOINT}/guild`;
export const AUCTION_API_ENDPOINT = `${API_ENDPOINT}/auction`;
export const LOL_STAT_API_ENDPOINT = `${API_ENDPOINT}/lol`;
export const VAL_STAT_API_ENDPOINT = `${API_ENDPOINT}/val`;
export const AUCTION_WS_ENDPOINT = `${WS_ENDPOINT}/auction`;

export function getMemberEndpoint(guildId: string) {
  return `${GUILD_API_ENDPOINT}/${guildId}/member`;
}

export function getPresetEndpoint(guildId: string) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset`;
}

export function getPresetMemberEndpoint(guildId: string, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/member`;
}

export function getPositionEndpoint(guildId: string, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/position`;
}

export function getTierEndpoint(guildId: string, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/tier`;
}

export function getPresetMemberPositionEndpoint(
  guildId: string,
  presetId: number,
  presetMemberId: number,
) {
  return `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}/position`;
}
