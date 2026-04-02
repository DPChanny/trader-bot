import {
  CloseButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Card } from "@/components/card";
import { Section } from "@/components/section";
import type { PositionDTO } from "@/dtos";
import styles from "@/styles/pages/preset/positionCard.module.css";

interface PositionCardProps {
  position: PositionDTO;
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

export function PositionCard({
  position,
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
}: PositionCardProps) {
  const hasChanges =
    editingName !== position.name ||
    editingIconUrl !== (position.iconUrl || "");

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
            src={position.iconUrl || undefined}
            alt={position.name}
            variantColor="blue"
            variantSize="large"
          >
            {position.name.charAt(0)}
          </Badge>

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
