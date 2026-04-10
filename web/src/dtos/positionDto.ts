export interface PositionDTO {
  positionId: number;
  presetId: number;
  name: string;
  iconUrl?: string | null;
}

export interface AddPositionDTO {
  name: string;
  iconUrl: string | null;
}

export interface UpdatePositionDTO {
  name?: string;
  iconUrl?: string | null;
}
