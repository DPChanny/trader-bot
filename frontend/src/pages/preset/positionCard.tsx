import {
  CloseButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from "@/components/button";
import { Badge } from "@/components/badge";
import { Input } from "@/components/input";
import { Section } from "@/components/section";
import type { Position } from "@/dto";
import { IconBadge } from "@/components/iconBadge";
import styles from "@/styles/pages/preset/positionCard.module.css";

interface PositionCardProps {
  position: Position;
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
    <Section variantType="tertiary" variantLayout="row" className={styles.card}>
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
            variantType="tertiary"
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
          {position.iconUrl ? (
            <IconBadge
              src={position.iconUrl}
              alt={position.name}
              variantColor="blue"
              variantSize="large"
            />
          ) : (
            <Badge variantColor="blue" variantSize="large">
              {position.name.charAt(0)}
            </Badge>
          )}
          <EditButton variantSize="small" onClick={onEdit} />
          <DeleteButton variantSize="small" disabled={isDeletePending} />
        </>
      )}
    </Section>
  );
}
