const API_ORIGIN = import.meta.env["VITE_API_ORIGIN"];
const WS_ORIGIN = import.meta.env["VITE_WS_ORIGIN"];

const API_ENDPOINT = `${API_ORIGIN}/api`;
const WS_ENDPOINT = `${WS_ORIGIN}/ws`;

const AUTH_API_ENDPOINT = `${API_ENDPOINT}/auth`;
const USER_API_ENDPOINT = `${API_ENDPOINT}/user`;
const GUILD_API_ENDPOINT = `${API_ENDPOINT}/guild`;
const AUCTION_API_ENDPOINT = `${API_ENDPOINT}/auction`;
const LOL_STAT_API_ENDPOINT = `${API_ENDPOINT}/lol`;
const VAL_STAT_API_ENDPOINT = `${API_ENDPOINT}/val`;
const AUCTION_WS_ENDPOINT = `${WS_ENDPOINT}/auction`;

export function getAuthEndpoint() {
  return AUTH_API_ENDPOINT;
}

export function getUserEndpoint() {
  return USER_API_ENDPOINT;
}

export function getGuildEndpoint() {
  return GUILD_API_ENDPOINT;
}

export function getMemberEndpoint(guildId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/member`;
}

export function getPresetEndpoint(guildId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset`;
}

export function getPresetMemberEndpoint(guildId: number, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/member`;
}

export function getPositionEndpoint(guildId: number, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/position`;
}

export function getTierEndpoint(guildId: number, presetId: number) {
  return `${getPresetEndpoint(guildId)}/${presetId}/tier`;
}

export function getPresetMemberPositionEndpoint(
  guildId: number,
  presetId: number,
  presetMemberId: number,
) {
  return `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}/position`;
}

export function getAuctionEndpoint() {
  return AUCTION_API_ENDPOINT;
}

export function getLolStatEndpoint() {
  return LOL_STAT_API_ENDPOINT;
}

export function getValStatEndpoint() {
  return VAL_STAT_API_ENDPOINT;
}

export function getAuctionWsEndpoint() {
  return AUCTION_WS_ENDPOINT;
}
