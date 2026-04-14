import { useState } from "preact/hooks";
import {
  useAddTier,
  useDeleteTier,
  useTiers,
  useUpdateTier,
} from "@/hooks/tier";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { Column, Row } from "@/components/commons/layout";
import { AddTierModal } from "./addTierModal";
import { UpdateTierModal } from "./updateTierModal";
import { DeleteTierModal } from "./deleteTierModal";
import { TierCard } from "./tierCard";
import styles from "@/styles/pages/presetPage/tierEditor/tierList.module.css";
import { SecondarySection } from "@/components/commons/section";
import type { AddTierDTO, TierDTO, UpdateTierDTO } from "@/dtos/tier";

interface TierEditorProps {
  guildId: string;
  presetId: number;
}

export function TierEditor({ guildId, presetId }: TierEditorProps) {
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [updatingTier, setUpdatingTier] = useState<TierDTO | null>(null);
  const [showDeleteTierModal, setShowDeleteTierModal] = useState(false);
  const [deletingTierId, setDeletingTierId] = useState<number | null>(null);

  const { data: tiers, isLoading, error } = useTiers(guildId, presetId);
  const addTier = useAddTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  const handleOpenAddTierModal = () => {
    setShowAddTierModal(true);
  };

  const handleCloseAddTierModal = () => {
    setShowAddTierModal(false);
    addTier.reset();
  };

  const handleAddTier = async (dto: AddTierDTO) => {
    await addTier.mutateAsync({ guildId, presetId, dto });
  };

  const handleUpdateTier = async (dto: UpdateTierDTO) => {
    if (!updatingTier) return;
    try {
      await updateTier.mutateAsync({
        guildId,
        presetId,
        tierId: updatingTier.tierId,
        dto,
      });
      setUpdatingTier(null);
      updateTier.reset();
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const handleCloseUpdateTierModal = () => {
    setUpdatingTier(null);
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
    <SecondarySection className={styles.wrapper}>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3>티어 목록</h3>
        {canEdit && (
          <PrimaryButton onClick={handleOpenAddTierModal}>추가</PrimaryButton>
        )}
      </Row>
      <Bar />

      <Column className={styles.tierList}>
        {error ? (
          <Error error={error}>티어 목록을 불러오는데 실패했습니다.</Error>
        ) : isLoading ? (
          <Loading />
        ) : (
          tiers?.map((tier) => (
            <TierCard
              key={tier.tierId}
              tier={tier}
              guildId={guildId}
              onEdit={() => setUpdatingTier(tier)}
              onDelete={() => handleOpenDeleteTierModal(tier.tierId)}
              isDeletePending={deleteTier.isPending}
            />
          ))
        )}
      </Column>

      {showAddTierModal && (
        <AddTierModal
          onClose={handleCloseAddTierModal}
          onSubmit={handleAddTier}
          isPending={addTier.isPending}
          error={addTier.isError ? addTier.error : undefined}
        />
      )}
      {updatingTier && (
        <UpdateTierModal
          tier={updatingTier}
          onClose={handleCloseUpdateTierModal}
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
    </SecondarySection>
  );
}
