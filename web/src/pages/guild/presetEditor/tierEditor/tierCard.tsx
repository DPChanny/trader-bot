import {
  CloseButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@/components/commons/button";
import { Badge } from "@/components/commons/badge";
import { Input } from "@/components/commons/input";
import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import type { TierDTO } from "@/dtos/tierDto";
import styles from "@/styles/pages/guild/presetEditor/tierEditor/tierCard.module.css";

interface TierCardProps {
  tier: TierDTO;
  isEditing: boolean;
  editingName: string;
  editingIconUrl: string;
  onEditingNameChange: (name: string) => void;
  onEditingIconUrlChange: (iconUrl: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isUpdatePending: boolean;
  isDeletePending: boolean;
}

export function TierCard({
  tier,
  isEditing,
  editingName,
  editingIconUrl,
  onEditingNameChange,
  onEditingIconUrlChange,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  isUpdatePending,
  isDeletePending,
}: TierCardProps) {
  const hasChanges =
    editingName !== tier.name || editingIconUrl !== (tier.iconUrl || "");

  return (
    <Card variantLayout="row" className={styles.card} variantIntent="secondary">
      {isEditing ? (
        <>
          <Input
            value={editingName}
            onChange={onEditingNameChange}
            onKeyPress={(e) => e.key === "Enter" && onSave()}
            variantSize="small"
          />
          <Input
            value={editingIconUrl}
            onChange={onEditingIconUrlChange}
            variantSize="small"
          />
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="tertiary"
          >
            <SaveButton
              variantSize="small"
              onClick={onSave}
              disabled={isUpdatePending || !hasChanges || !editingName.trim()}
            />
            <CloseButton variantSize="small" onClick={onCancelEdit} />
          </Section>
        </>
      ) : (
        <>
          <Badge
            src={tier.iconUrl || undefined}
            alt={tier.name}
            variantColor="red"
            variantSize="large"
          >
            {tier.name.charAt(0)}
          </Badge>
          <span className={styles.name}>{tier.name}</span>

          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="tertiary"
          >
            <EditButton variantSize="small" onClick={onEdit} />
            <DeleteButton
              variantSize="small"
              disabled={isDeletePending}
              onClick={onDelete}
            />
          </Section>
        </>
      )}
    </Card>
  );
}
