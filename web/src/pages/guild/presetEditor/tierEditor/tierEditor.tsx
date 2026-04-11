import { useState } from "preact/hooks";
import {
  useAddTier,
  useDeleteTier,
  useTiers,
  useUpdateTier,
} from "@/hooks/tier";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { AddTierModal } from "./addTierModal";
import { EditTierModal } from "./editTierModal";
import { DeleteTierModal } from "./deleteTierModal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/guild/presetEditor/tierEditor/tierList.module.css";
import { Section } from "@/components/commons/section";
import type { TierDTO } from "@/dtos/tierDto";

interface TierEditorProps {
  guildId: string;
  presetId: number;
}

export function TierEditor({ guildId, presetId }: TierEditorProps) {
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<TierDTO | null>(null);
  const [showDeleteTierModal, setShowDeleteTierModal] = useState(false);
  const [deletingTierId, setDeletingTierId] = useState<number | null>(null);

  const { data: tiers, isLoading, error } = useTiers(guildId, presetId);
  const addTier = useAddTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();

  const handleOpenAddTierModal = () => {
    setShowAddTierModal(true);
  };

  const handleCloseAddTierModal = () => {
    setShowAddTierModal(false);
    addTier.reset();
  };

  const handleAddTier = async (input: {
    name: string;
    iconUrl: string | null;
  }) => {
    await addTier.mutateAsync({ guildId, presetId, dto: input });
  };

  const handleUpdateTier = async (name: string, iconUrl: string | null) => {
    if (!editingTier) return;
    try {
      await updateTier.mutateAsync({
        guildId,
        presetId,
        tierId: editingTier.tierId,
        dto: { name, iconUrl },
      });
      setEditingTier(null);
      updateTier.reset();
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const handleCloseEditTierModal = () => {
    setEditingTier(null);
    updateTier.reset();
  };

  const handleOpenDeleteTierModal = (tierId: number) => {
    setDeletingTierId(tierId);
    setShowDeleteTierModal(true);
  };

  const handleCloseDeleteTierModal = () => {
    setShowDeleteTierModal(false);
    setDeletingTierId(null);
  };

  const handleDeleteTier = async () => {
    if (deletingTierId === null) return;
    try {
      await deleteTier.mutateAsync({
        guildId,
        presetId,
        tierId: deletingTierId,
      });
      handleCloseDeleteTierModal();
    } catch (err) {
      console.error("Failed to delete tier:", err);
    }
  };

  return (
    <Section variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h3>티어 목록</h3>
        <PrimaryButton onClick={handleOpenAddTierModal}>추가</PrimaryButton>
      </Section>
      <Bar />

      <Section
        variantTone="ghost"
        variantLayout="column"
        variantIntent="secondary"
        className={styles.tierList}
      >
        {error ? (
          <Error detail={error?.message}>
            티어 목록을 불러오는데 실패했습니다.
          </Error>
        ) : isLoading ? (
          <Loading />
        ) : (
          tiers?.map((tier) => (
            <TierCard
              key={tier.tierId}
              tier={tier}
              onEdit={() => setEditingTier(tier)}
              onDelete={() => handleOpenDeleteTierModal(tier.tierId)}
              isDeletePending={deleteTier.isPending}
            />
          ))
        )}
      </Section>

      {showAddTierModal && (
        <AddTierModal
          onClose={handleCloseAddTierModal}
          onSubmit={handleAddTier}
          isPending={addTier.isPending}
          error={addTier.isError ? addTier.error : undefined}
        />
      )}
      {editingTier && (
        <EditTierModal
          tier={editingTier}
          onClose={handleCloseEditTierModal}
          onSubmit={handleUpdateTier}
          isPending={updateTier.isPending}
          error={updateTier.isError ? updateTier.error : undefined}
        />
      )}
      {showDeleteTierModal && (
        <DeleteTierModal
          onClose={handleCloseDeleteTierModal}
          onConfirm={handleDeleteTier}
          isPending={deleteTier.isPending}
          error={deleteTier.isError ? deleteTier.error : undefined}
        />
      )}
    </Section>
  );
}
