import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

interface PresetPageContextValue {
  selectedPresetId: number | null;
  setSelectedPresetId: (id: number | null) => void;
  selectedPresetMemberId: number | null;
  setSelectedPresetMemberId: (id: number | null) => void;
  addingMemberIds: Set<number>;
  addMemberIdToAdding: (memberId: number) => void;
  removeMemberIdFromAdding: (memberId: number) => void;
  removingMemberIds: Set<number>;
  addMemberIdToRemoving: (memberId: number) => void;
  removeMemberIdFromRemoving: (memberId: number) => void;
  isCreatingPreset: boolean;
  openCreatePreset: () => void;
  closeCreatePreset: () => void;
}

const PresetPageContext = createContext<PresetPageContextValue>({
  selectedPresetId: null,
  setSelectedPresetId: () => {},
  selectedPresetMemberId: null,
  setSelectedPresetMemberId: () => {},
  addingMemberIds: new Set(),
  addMemberIdToAdding: () => {},
  removeMemberIdFromAdding: () => {},
  removingMemberIds: new Set(),
  addMemberIdToRemoving: () => {},
  removeMemberIdFromRemoving: () => {},
  isCreatingPreset: false,
  openCreatePreset: () => {},
  closeCreatePreset: () => {},
});

export function PresetPageProvider({ children }: { children: any }) {
  const [selectedPresetId, setSelectedPresetIdState] = useState<number | null>(
    null,
  );
  const [selectedPresetMemberId, setSelectedPresetMemberId] = useState<
    number | null
  >(null);
  const [addingMemberIds, setAddingMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [removingMemberIds, setRemovingMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  const setSelectedPresetId = (id: number | null) => {
    setSelectedPresetIdState(id);
    setSelectedPresetMemberId(null);
    setAddingMemberIds(new Set());
    setRemovingMemberIds(new Set());
  };

  return (
    <PresetPageContext.Provider
      value={{
        selectedPresetId,
        setSelectedPresetId,
        selectedPresetMemberId,
        setSelectedPresetMemberId,
        addingMemberIds,
        addMemberIdToAdding: (id) =>
          setAddingMemberIds((prev) => new Set(prev).add(id)),
        removeMemberIdFromAdding: (id) =>
          setAddingMemberIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }),
        removingMemberIds,
        addMemberIdToRemoving: (id) =>
          setRemovingMemberIds((prev) => new Set(prev).add(id)),
        removeMemberIdFromRemoving: (id) =>
          setRemovingMemberIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }),
        isCreatingPreset,
        openCreatePreset: () => setIsCreatingPreset(true),
        closeCreatePreset: () => setIsCreatingPreset(false),
      }}
    >
      {children}
    </PresetPageContext.Provider>
  );
}

export function usePresetPageContext() {
  return useContext(PresetPageContext);
}
