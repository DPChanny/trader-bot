import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type {
  AddPresetDTO,
  PresetDTO,
  PresetDetailDTO,
  UpdatePresetDTO,
} from "@/dtos/presetDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetEndpoint } from "@/utils/endpoint";
import { handleHttpError } from "@/utils/hook";

export function usePresets(guildId: number | null) {
  return useQuery({
    queryKey: ["presets", guildId],
    queryFn: async (): Promise<PresetDTO[]> => {
      const response = await fetch(getPresetEndpoint(guildId!), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetDTO[]>(json);
    },
    enabled: !!guildId,
  });
}

export function usePresetDetail(
  guildId: number | null,
  presetId: number | null,
) {
  return useQuery({
    queryKey: ["preset", guildId, presetId],
    queryFn: async (): Promise<PresetDetailDTO | null> => {
      if (!guildId || !presetId) return null;
      const response = await fetch(
        `${getPresetEndpoint(guildId)}/${presetId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetDetailDTO>(json);
    },
    enabled: !!guildId && !!presetId,
  });
}

export function useAddPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      dto,
    }: {
      guildId: number;
      dto: AddPresetDTO;
    }): Promise<PresetDTO> => {
      const response = await fetch(getPresetEndpoint(guildId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(dto)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      dto,
    }: {
      guildId: number;
      presetId: number;
      dto: UpdatePresetDTO;
    }): Promise<PresetDTO> => {
      const response = await fetch(
        `${getPresetEndpoint(guildId)}/${presetId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(dto)),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
    }: {
      guildId: number;
      presetId: number;
    }): Promise<void> => {
      const response = await fetch(
        `${getPresetEndpoint(guildId)}/${presetId}`,
        {
          method: "DELETE",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
      });
      queryClient.removeQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}
