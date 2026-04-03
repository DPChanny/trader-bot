import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

interface MemberPageContextValue {
  selectedMemberId: number | null;
  setSelectedMemberId: (id: number | null) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const MemberPageContext = createContext<MemberPageContextValue>({
  selectedMemberId: null,
  setSelectedMemberId: () => {},
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export function MemberPageProvider({ children }: { children: any }) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <MemberPageContext.Provider
      value={{
        selectedMemberId,
        setSelectedMemberId,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </MemberPageContext.Provider>
  );
}

export function useMemberPageContext() {
  return useContext(MemberPageContext);
}
