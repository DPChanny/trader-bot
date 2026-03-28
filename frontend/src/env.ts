const API_ORIGIN = import.meta.env["VITE_API_ORIGIN"];
const WS_ORIGIN = import.meta.env["VITE_WS_ORIGIN"];

export const API_ENDPOINT = `${API_ORIGIN}/api`;
export const WS_ENDPOINT = `${WS_ORIGIN}/ws`;

export const AUTH_API_ENDPOINT = `${API_ENDPOINT}/auth`;
export const USER_API_ENDPOINT = `${API_ENDPOINT}/user`;
export const GUILD_API_ENDPOINT = `${API_ENDPOINT}/guild`;
export const AUCTION_API_ENDPOINT = `${API_ENDPOINT}/auction`;
export const LOL_STAT_API_ENDPOINT = `${API_ENDPOINT}/lol`;
export const VAL_STAT_API_ENDPOINT = `${API_ENDPOINT}/val`;

export const AUCTION_WS_ENDPOINT = `${WS_ENDPOINT}/auction`;
