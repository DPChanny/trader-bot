const GUILD_KEY = "guild";

import type { GuildDTO } from "@/dtos";

export function setGuild(guild: GuildDTO): void {
  sessionStorage.setItem(GUILD_KEY, JSON.stringify(guild));
}

export function getGuild(): GuildDTO | null {
  try {
    const stored = sessionStorage.getItem(GUILD_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as GuildDTO;
  } catch {
    return null;
  }
}

export function clearGuild(): void {
  sessionStorage.removeItem(GUILD_KEY);
}
