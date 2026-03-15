const API_HOST = import.meta.env["VITE_API_HOST"] || "localhost";
const WS_HOST = import.meta.env["VITE_WS_HOST"] || "localhost";

const API_ORIGIN = "http://" + API_HOST;
const WS_ORIGIN = "ws://" + WS_HOST;

export const API_ENDPOINT = `${API_ORIGIN}/api`;
export const WS_ENDPOINT = `${WS_ORIGIN}/ws`;

export const AUCTION_API_ENDPOINT = `${API_ENDPOINT}/auction`;
export const USER_API_ENDPOINT = `${API_ENDPOINT}/user`;
export const PRESET_API_ENDPOINT = `${API_ENDPOINT}/preset`;
export const TIER_API_ENDPOINT = `${API_ENDPOINT}/tier`;
export const POSITION_API_ENDPOINT = `${API_ENDPOINT}/position`;
export const PRESET_USER_API_ENDPOINT = `${API_ENDPOINT}/preset_user`;
export const PRESET_USER_POSITION_API_ENDPOINT = `${API_ENDPOINT}/preset_user_position`;
export const ADMIN_API_ENDPOINT = `${API_ENDPOINT}/admin`;
export const LOL_STAT_API_ENDPOINT = `${API_ENDPOINT}/lol`;
export const VAL_STAT_API_ENDPOINT = `${API_ENDPOINT}/val`;

export const AUCTION_WS_ENDPOINT = `${WS_ENDPOINT}/auction`;
