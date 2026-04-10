import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

interface MemberPageContextValue {
  selectedMemberId: number | null;
  setSelectedMemberId: (id: number | null) => void;
}

const MemberPageContext = createContext<MemberPageContextValue>({
  selectedMemberId: null,
  setSelectedMemberId: () => {},
});

export function MemberPageProvider({ children }: { children: any }) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  return (
    <MemberPageContext.Provider
      value={{
        selectedMemberId,
        setSelectedMemberId,
      }}
    >
      {children}
    </MemberPageContext.Provider>
  );
}

export function useMemberPageContext() {
  return useContext(MemberPageContext);
}
