const GUILD_KEY = "selected_guild";

export interface SelectedGuild {
  guildId: number;
  name: string;
}

export function setSelectedGuild(guild: SelectedGuild): void {
  sessionStorage.setItem(GUILD_KEY, JSON.stringify(guild));
}

export function getSelectedGuild(): SelectedGuild | null {
  try {
    const stored = sessionStorage.getItem(GUILD_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SelectedGuild;
  } catch {
    return null;
  }
}

export function clearSelectedGuild(): void {
  sessionStorage.removeItem(GUILD_KEY);
}
