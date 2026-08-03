import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {

  createManagedUser,

  getManagedUser,

  listManagedUsers,

  resetManagedUserPassword,

  revokeManagedSession,

  updateManagedUser,

  type CreateUserInput,

  type ManagedUser,

  type ManagedUserRole,

  type UpdateUserInput,

} from "@/apis/userManagement.api";

import { STALE_TIME } from "@/lib/queryConfig";

import { queryKeys } from "@/lib/queryKeys";



export type ManagedUserRoleFilter = "ALL" | ManagedUserRole;



export interface ListManagedUsersParams {

  search?: string;

  role?: ManagedUserRole;

  page: number;

  limit: number;

}



export interface PaginatedManagedUsers {

  items: ManagedUser[];

  meta: {

    total: number;

    page: number;

    limit: number;

    totalPages: number;

  };

}



function filterUsers(

  users: ManagedUser[],

  params: ListManagedUsersParams,

): ManagedUser[] {

  const search = params.search?.trim().toLowerCase();

  return users.filter((user) => {

    if (params.role && user.role !== params.role) {

      return false;

    }

    if (search && !user.username.toLowerCase().includes(search)) {
      const displayName = user.displayName?.toLowerCase() ?? "";
      if (!displayName.includes(search)) {
        return false;
      }
    }

    return true;

  });

}



function paginateUsers(

  users: ManagedUser[],

  page: number,

  limit: number,

): PaginatedManagedUsers {

  const total = users.length;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const start = (safePage - 1) * limit;



  return {

    items: users.slice(start, start + limit),

    meta: {

      total,

      page: safePage,

      limit,

      totalPages,

    },

  };

}



export function useManagedUsers(params: ListManagedUsersParams) {

  const listQuery = useQuery({

    queryKey: queryKeys.managedUsers.list(),

    queryFn: listManagedUsers,

    staleTime: STALE_TIME.transactional,

  });



  const data = useMemo(() => {

    const allUsers = listQuery.data ?? [];

    const filtered = filterUsers(allUsers, params);

    return paginateUsers(filtered, params.page, params.limit);

  }, [listQuery.data, params]);



  return {

    ...listQuery,

    data,

  };

}



export function useManagedUser(id: string | null) {

  return useQuery({

    queryKey: queryKeys.managedUsers.detail(id ?? ""),

    queryFn: () => getManagedUser(id!),

    enabled: Boolean(id),

    staleTime: STALE_TIME.transactional,

  });

}



export function useManagedUserMutations() {

  const queryClient = useQueryClient();



  const invalidateUsers = () =>

    queryClient.invalidateQueries({ queryKey: queryKeys.managedUsers.all });



  return {

    create: useMutation({

      mutationFn: (input: CreateUserInput) => createManagedUser(input),

      onSuccess: invalidateUsers,

    }),

    update: useMutation({

      mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>

        updateManagedUser(id, input),

      onSuccess: (_data, variables) => {

        invalidateUsers();

        queryClient.invalidateQueries({

          queryKey: queryKeys.managedUsers.detail(variables.id),

        });

      },

    }),

    resetPassword: useMutation({

      mutationFn: ({ id, password }: { id: string; password: string }) =>

        resetManagedUserPassword(id, password),

    }),

    revokeSession: useMutation({

      mutationFn: ({

        sessionId,

      }: {

        sessionId: string;

        userId: string;

      }) => revokeManagedSession(sessionId),

      onSuccess: (_data, variables) => {

        invalidateUsers();

        queryClient.invalidateQueries({

          queryKey: queryKeys.managedUsers.detail(variables.userId),

        });

      },

    }),

  };

}

