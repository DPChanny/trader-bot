export interface PresetDTO {
  presetId: number;
  guildId: string;
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
}

export interface CreatePresetDTO {
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
}

export interface UpdatePresetDTO {
  name?: string;
  points?: number;
  timer?: number;
  teamSize?: number;
  pointScale?: number;
}
