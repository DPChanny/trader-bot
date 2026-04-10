import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import type { GuildDTO } from "@/dtos/guildDto";
import { setGuild as persistGuild, getGuild, clearGuild } from "@/utils/guild";

interface GuildContextValue {
  guild: GuildDTO | null;
  setGuild: (guild: GuildDTO) => void;
  clearGuild: () => void;
}

const GuildContext = createContext<GuildContextValue>({
  guild: null,
  setGuild: () => {},
  clearGuild: () => {},
});

export function GuildProvider({ children }: { children: any }) {
  const [guild, setGuildState] = useState<GuildDTO | null>(() => getGuild());

  const handleSetGuild = (newGuild: GuildDTO) => {
    persistGuild(newGuild);
    setGuildState(newGuild);
  };

  const handleClearGuild = () => {
    clearGuild();
    setGuildState(null);
  };

  return (
    <GuildContext.Provider
      value={{
        guild,
        setGuild: handleSetGuild,
        clearGuild: handleClearGuild,
      }}
    >
      {children}
    </GuildContext.Provider>
  );
}

export function useGuildContext() {
  return useContext(GuildContext);
}
