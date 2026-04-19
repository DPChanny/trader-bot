const API_ORIGIN =
  import.meta.env["VITE_API_ORIGIN"] ?? "http://127.0.0.1:5173";
const DISCORD_CLIENT_ID = import.meta.env["VITE_DISCORD_CLIENT_ID"];

const API_ENDPOINT = `${API_ORIGIN}/api`;
const WS_ENDPOINT = `${API_ORIGIN.replace(/^http/, "ws")}/api`;

export const GUILD_INVITE_URL = import.meta.env["VITE_GUILD_INVITE_URL"];

export const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot`;

export const AUTH_API_ENDPOINT = `${API_ENDPOINT}/auth`;
export const USER_API_ENDPOINT = `${API_ENDPOINT}/user`;
export const GUILD_API_ENDPOINT = `${API_ENDPOINT}/guild`;

function getEndpoint(ws?: boolean) {
  return ws ? WS_ENDPOINT : API_ENDPOINT;
}

export function getMemberEndpoint(guildId: string, ws?: boolean) {
  return `${getEndpoint(ws)}/guild/${guildId}/member`;
}

export function getPresetEndpoint(guildId: string, ws?: boolean) {
  return `${getEndpoint(ws)}/guild/${guildId}/preset`;
}

export function getAuctionEndpoint(
  guildId: string,
  presetId: number,
  ws?: boolean,
) {
  return `${getPresetEndpoint(guildId, ws)}/${presetId}/auction`;
}

export function getPresetMemberEndpoint(
  guildId: string,
  presetId: number,
  ws?: boolean,
) {
  return `${getPresetEndpoint(guildId, ws)}/${presetId}/member`;
}

export function getPositionEndpoint(
  guildId: string,
  presetId: number,
  ws?: boolean,
) {
  return `${getPresetEndpoint(guildId, ws)}/${presetId}/position`;
}

export function getTierEndpoint(
  guildId: string,
  presetId: number,
  ws?: boolean,
) {
  return `${getPresetEndpoint(guildId, ws)}/${presetId}/tier`;
}

export function getPresetMemberPositionEndpoint(
  guildId: string,
  presetId: number,
  presetMemberId: number,
  ws?: boolean,
) {
  return `${getPresetMemberEndpoint(guildId, presetId, ws)}/${presetMemberId}/position`;
}
