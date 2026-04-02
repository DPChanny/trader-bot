const GUILD_KEY = "guild";

import type { Guild } from "@/dto";

export function setGuild(guild: Guild): void {
  sessionStorage.setItem(GUILD_KEY, JSON.stringify(guild));
}

export function getGuild(): Guild | null {
  try {
    const stored = sessionStorage.getItem(GUILD_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Guild;
  } catch {
    return null;
  }
}

export function clearGuild(): void {
  sessionStorage.removeItem(GUILD_KEY);
}
