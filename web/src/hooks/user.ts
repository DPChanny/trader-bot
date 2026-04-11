import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { UserDetailDTO } from "@/dtos/userDto";
import {
  getAuthHeaders,
  getAuthHeadersForMutation,
  getAuthToken,
} from "@/utils/auth";
import { USER_API_ENDPOINT } from "@/utils/env";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<UserDetailDTO | null> => {
      if (!getAuthToken()) return null;

      const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) return null;
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDetailDTO>(json);
    },
    retry: false,
  });
}

export function useDeleteMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
