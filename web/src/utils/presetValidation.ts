export const PRESET_NAME_MIN_LENGTH = 1;
export const PRESET_NAME_MAX_LENGTH = 256;

export const PRESET_POINTS_MIN = 0;
export const PRESET_POINTS_MAX = 1_000;

export const PRESET_POINT_SCALE_MIN = 1;
export const PRESET_POINT_SCALE_MAX = 10;

export const PRESET_TIMER_MIN = 1;
export const PRESET_TIMER_MAX = 60;

export const PRESET_TEAM_SIZE_MIN = 1;
export const PRESET_TEAM_SIZE_MAX = 10;

export const PRESET_DEFAULT_POINTS = 1000;
export const PRESET_DEFAULT_POINT_SCALE = 5;
export const PRESET_DEFAULT_TIMER = 15;
export const PRESET_DEFAULT_TEAM_SIZE = 5;
export const PRESET_DISPLAY_POINTS_MAX =
  PRESET_POINTS_MAX * PRESET_POINT_SCALE_MAX;

export interface PresetFormValues {
  name: string;
  points: number;
  pointScale: number;
  timer: number;
  teamSize: number;
}

interface CreatePresetRawValues {
  name: string;
  points: string;
  pointScale: string;
  timer: string;
  teamSize: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const normalizePresetName = (name: string): string => name.trim();

export const sanitizePresetInteger = (
  value: string,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return clamp(normalized, min, max);
};

export const toStoredPoints = (
  displayPoints: number,
  pointScale: number,
): number => Math.trunc(displayPoints / pointScale);

export const toDisplayPoints = (
  storedPoints: number,
  pointScale: number,
): number => storedPoints * pointScale;

export const normalizeCreatePresetValues = (
  raw: CreatePresetRawValues,
): PresetFormValues => {
  const pointScale = sanitizePresetInteger(
    raw.pointScale,
    PRESET_DEFAULT_POINT_SCALE,
    PRESET_POINT_SCALE_MIN,
    PRESET_POINT_SCALE_MAX,
  );
  const displayPoints = sanitizePresetInteger(
    raw.points,
    PRESET_DEFAULT_POINTS * pointScale,
    PRESET_POINTS_MIN,
    PRESET_DISPLAY_POINTS_MAX,
  );

  return {
    name: normalizePresetName(raw.name),
    points: clamp(
      toStoredPoints(displayPoints, pointScale),
      PRESET_POINTS_MIN,
      PRESET_POINTS_MAX,
    ),
    pointScale,
    timer: sanitizePresetInteger(
      raw.timer,
      PRESET_DEFAULT_TIMER,
      PRESET_TIMER_MIN,
      PRESET_TIMER_MAX,
    ),
    teamSize: sanitizePresetInteger(
      raw.teamSize,
      PRESET_DEFAULT_TEAM_SIZE,
      PRESET_TEAM_SIZE_MIN,
      PRESET_TEAM_SIZE_MAX,
    ),
  };
};

export const isPresetPointRulesValid = (
  _points: number,
  _pointScale: number,
): boolean => {
  return true;
};

export const isPresetFormValid = (values: PresetFormValues): boolean => {
  const isNameValid =
    values.name.length >= PRESET_NAME_MIN_LENGTH &&
    values.name.length <= PRESET_NAME_MAX_LENGTH;

  const isPointsValid =
    values.points >= PRESET_POINTS_MIN && values.points <= PRESET_POINTS_MAX;
  const isPointScaleValid =
    values.pointScale >= PRESET_POINT_SCALE_MIN &&
    values.pointScale <= PRESET_POINT_SCALE_MAX;
  const isTimerValid =
    values.timer >= PRESET_TIMER_MIN && values.timer <= PRESET_TIMER_MAX;
  const isTeamSizeValid =
    values.teamSize >= PRESET_TEAM_SIZE_MIN &&
    values.teamSize <= PRESET_TEAM_SIZE_MAX;

  return (
    isNameValid &&
    isPointsValid &&
    isPointScaleValid &&
    isTimerValid &&
    isTeamSizeValid &&
    isPresetPointRulesValid(values.points, values.pointScale)
  );
};
