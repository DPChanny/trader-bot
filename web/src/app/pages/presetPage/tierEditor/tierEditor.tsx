import { useState } from "preact/hooks";
import {
  useAddTier,
  useDeleteTier,
  useTiers,
  useUpdateTier,
} from "@hooks/tier";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { Loading } from "@components/molecules/loading";
import { ErrorMessage } from "@components/molecules/errorMessage";
import { PrimaryButton } from "@components/atoms/button";
import { Row, Scroll } from "@components/atoms/layout";
import { AddTierModal } from "./addTierModal";
import { UpdateTierModal } from "./updateTierModal";
import { DeleteTierModal } from "./deleteTierModal";
import { TierCard } from "./tierCard";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Title } from "@components/atoms/text";
import type { AddTierDTO, TierDTO, UpdateTierDTO } from "@dtos/tier";

interface TierEditorProps {
  guildId: string;
  presetId: number;
}

export function TierEditor({ guildId, presetId }: TierEditorProps) {
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [updatingTier, setUpdatingTier] = useState<TierDTO | null>(null);
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

  const handleUpdateTier = (dto: UpdateTierDTO) => {
    if (!updatingTier) return;
    updateTier.mutate(
      {
        guildId,
        presetId,
        tierId: updatingTier.tierId,
        dto,
      },
      {
        onSuccess: () => {
          setUpdatingTier(null);
          updateTier.reset();
        },
      },
    );
  };

  const handleCloseUpdateTierModal = () => {
    setUpdatingTier(null);
    updateTier.reset();
  };

  const handleOpenDeleteTierModal = (tierId: number) => {
    setDeletingTierId(tierId);
  };

  const handleCloseDeleteTierModal = () => {
    setDeletingTierId(null);
    deleteTier.reset();
  };

  const handleDeleteTier = () => {
    if (deletingTierId === null) return;
    deleteTier.mutate(
      {
        guildId,
        presetId,
        tierId: deletingTierId,
      },
      {
        onSuccess: () => {
          handleCloseDeleteTierModal();
        },
      },
    );
  };

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>티어 목록</Title>
        {canEdit && (
          <PrimaryButton onClick={handleOpenAddTierModal}>추가</PrimaryButton>
        )}
      </Row>
      <TertiarySection fill>
        <Scroll axis="y">
          {error ? (
            <ErrorMessage error={error}>
              티어 목록을 불러오지 못했습니다.
            </ErrorMessage>
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
        </Scroll>
      </TertiarySection>

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
      {deletingTierId !== null && (
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
