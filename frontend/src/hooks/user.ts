import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { AddUserDTO, UpdateUserDTO, UserDTO } from "@/dtos";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { USER_API_ENDPOINT } from "@/utils/endpoint";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserDTO[]> => {
      const response = await fetch(`${USER_API_ENDPOINT}`);
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO[]>(json);
    },
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: async (): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`);
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    enabled: !!userId,
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: AddUserDTO): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(dto)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      dto,
    }: {
      userId: number;
      dto: UpdateUserDTO;
    }): Promise<UserDTO> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(dto)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<UserDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      const response = await fetch(`${USER_API_ENDPOINT}/${userId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["users", userId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
}
