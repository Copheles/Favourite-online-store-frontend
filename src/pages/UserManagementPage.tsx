import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MonitorSmartphone, Pencil, Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiErrorAlert, getApiErrorMessage } from "@/components/forms/ApiErrorAlert";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextField } from "@/components/forms/FormTextField";
import {
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/shared/PageStates";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import { DeleteConfirmModal } from "@/components/shared/pos/DeleteConfirmModal";
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosFilterSelect } from "@/components/shared/pos/PosFilterSelect";
import { PosPagination } from "@/components/shared/pos/PosPagination";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useBranch } from "@/hooks/useBranch";
import {
  useManagedUser,
  useManagedUserMutations,
  useManagedUsers,
  type ManagedUserRoleFilter,
} from "@/hooks/useManagedUsers";
import { useUrlEnumParam, useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { PAGE_SIZE } from "@/lib/queryConfig";
import { formatDateTime } from "@/lib/format";
import type {
  ManagedUser,
  ManagedUserRole,
  ManagedUserSession,
} from "@/apis/userManagement.api";

const ROLE_FILTERS: ManagedUserRoleFilter[] = ["ALL", "owner", "admin", "staff", "monitor"];
const ROLE_OPTIONS: ManagedUserRole[] = ["owner", "admin", "staff", "monitor"];

function managedUserRoleLabel(
  role: ManagedUserRole,
  t: (key: string) => string,
): string {
  if (role === "owner") return t("pos.users.roleOwner");
  if (role === "admin") return t("pos.users.roleAdmin");
  if (role === "monitor") return t("pos.users.roleMonitor");
  return t("pos.users.roleStaff");
}

function roleFilterToApi(
  filter: ManagedUserRoleFilter,
): ManagedUserRole | undefined {
  if (filter === "ALL") return undefined;
  return filter;
}

function RoleBadge({ role }: { role: ManagedUserRole }) {
  const { t } = useTranslation();

  const className =
    role === "owner"
      ? "inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
      : role === "admin"
        ? "inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        : role === "monitor"
          ? "inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          : "inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  const label =
    role === "owner"
      ? t("pos.users.roleOwner")
      : role === "admin"
        ? t("pos.users.roleAdmin")
        : role === "monitor"
          ? t("pos.users.roleMonitor")
          : t("pos.users.roleStaff");

  return <span className={className}>{label}</span>;
}

function getCreateUserSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(3, t("pos.validation.usernameMin")),
    displayName: z
      .string()
      .max(64, t("pos.validation.max64"))
      .optional()
      .or(z.literal("")),
    initialPassword: z.string().min(8, t("pos.validation.passwordMin")),
    role: z.enum(["owner", "admin", "staff", "monitor"]),
    defaultBranchId: z.string().min(1, t("pos.validation.branchRequired")),
    maxAllowedDevices: z.number().int().min(1).max(10),
  });
}

type CreateUserFormValues = z.infer<ReturnType<typeof getCreateUserSchema>>;

const editUserSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string().min(3, t("pos.validation.usernameMin")),
    displayName: z
      .string()
      .max(64, t("pos.validation.max64"))
      .optional()
      .or(z.literal("")),
    role: z.enum(["owner", "admin", "staff", "monitor"]),
    defaultBranchId: z.string().min(1, t("pos.validation.branchRequired")),
    maxAllowedDevices: z.number().int().min(1).max(10),
    isActive: z.enum(["true", "false"]),
    newPassword: z
      .string()
      .max(128, t("pos.validation.max128"))
      .optional()
      .or(z.literal("")),
  });

type EditUserFormValues = z.infer<ReturnType<typeof editUserSchema>>;

export function UserManagementPage() {
  const { t } = useTranslation();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(PAGE_SIZE.default, [10, 20, 50]);
  const [roleFilter, setRoleFilter] = useUrlEnumParam<ManagedUserRoleFilter>(
    "role",
    "ALL",
    ROLE_FILTERS,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null);

  const query = useManagedUsers({
    search: appliedSearch || undefined,
    role: roleFilterToApi(roleFilter),
    page,
    limit,
  });
  const mutations = useManagedUserMutations();

  const rows = query.data?.items ?? [];
  const totalPages = query.data?.meta.totalPages ?? 1;

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.modules.userManagement")}
        description={t("pos.users.description")}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("pos.users.add")}
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PosFilterSelect
            value={roleFilter}
            options={ROLE_FILTERS}
            onChange={setRoleFilter}
            ariaLabel={t("pos.users.filterByRole")}
            getLabel={(value) => {
              if (value === "ALL") return t("pos.filters.contact.ALL");
              if (value === "owner") return t("pos.users.roleOwner");
              if (value === "admin") return t("pos.users.roleAdmin");
              if (value === "monitor") return t("pos.users.roleMonitor");
              return t("pos.users.roleStaff");
            }}
            className="h-9 w-full sm:w-52"
          />
          <PosSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            onClear={resetSearch}
            placeholder={t("pos.users.searchPlaceholder")}
            hideButton
            className="w-full sm:w-auto sm:max-w-xs"
          />
        </div>
      </div>

      {query.isLoading && !query.data && <TableSkeleton />}
      {query.isError && <ErrorState message={t("pos.users.loadError")} />}
      {!query.isLoading && rows.length === 0 && (
        <EmptyState message={t("pos.users.empty")} />
      )}

      {!query.isLoading && rows.length > 0 && (
        <>
          <PosDataTable>
            <PosTable>
              <PosTableHead>
                <PosTableRow>
                  <PosTableHeaderCell>{t("pos.users.username")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.users.role")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.users.sessions")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.users.createdAt")}</PosTableHeaderCell>
                  <PosTableHeaderCell />
                </PosTableRow>
              </PosTableHead>
              <PosTableBody>
                {rows.map((row) => (
                  <PosTableRow key={row.id}>
                    <PosTableCell className="font-medium">
                      <div>{row.username}</div>
                      {row.displayName && row.displayName !== row.username && (
                        <div className="text-xs text-muted-foreground">
                          {row.displayName}
                        </div>
                      )}
                      {!row.isActive && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({t("pos.users.inactive")})
                        </span>
                      )}
                    </PosTableCell>
                    <PosTableCell>
                      <RoleBadge role={row.role} />
                    </PosTableCell>
                    <PosTableCell>
                      {t("pos.users.sessionCount", {
                        active: row.activeSessionCount,
                        limit: row.maxAllowedDevices,
                      })}
                    </PosTableCell>
                    <PosTableCell>{formatDateTime(row.createdAt)}</PosTableCell>
                    <PosTableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSessionsUserId(row.id)}
                        >
                          <MonitorSmartphone className="size-3.5" />
                          {t("pos.users.viewSessions")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(row)}
                        >
                          <Pencil className="size-3.5" />
                          {t("pos.common.edit")}
                        </Button>
                      </div>
                    </PosTableCell>
                  </PosTableRow>
                ))}
              </PosTableBody>
            </PosTable>
          </PosDataTable>

          <PosPagination
            page={page}
            totalPages={totalPages}
            total={query.data?.meta.total}
            limit={limit}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
          />
        </>
      )}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          mutation={mutations.create}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          updateMutation={mutations.update}
          resetPasswordMutation={mutations.resetPassword}
        />
      )}

      {sessionsUserId && (
        <SessionsModal
          userId={sessionsUserId}
          onClose={() => setSessionsUserId(null)}
          revokeMutation={mutations.revokeSession}
        />
      )}
    </PosPageShell>
  );
}

function CreateUserModal({
  onClose,
  mutation,
}: {
  onClose: () => void;
  mutation: ReturnType<typeof useManagedUserMutations>["create"];
}) {
  const { t } = useTranslation();
  const { accessibleBranches } = useBranch();
  const schema = useMemo(() => getCreateUserSchema(t), [t]);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      displayName: "",
      initialPassword: "",
      role: "staff",
      defaultBranchId: accessibleBranches[0]?.id ?? "",
      maxAllowedDevices: 1,
    },
  });

  useEffect(() => {
    if (mutation.isSuccess) {
      form.reset();
      onClose();
      mutation.reset();
    }
  }, [mutation.isSuccess, form, onClose, mutation]);

  return (
    <PosModal
      onClose={onClose}
      title={t("pos.users.createTitle")}
      closeLabel={t("pos.common.close")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate({
              ...values,
              displayName: values.displayName?.trim() || undefined,
            }),
          )}
          className="space-y-3"
        >
          <FormTextField
            control={form.control}
            name="username"
            label={t("pos.users.username")}
          />
          <FormTextField
            control={form.control}
            name="displayName"
            label={t("pos.users.displayName")}
          />
          <FormTextField
            control={form.control}
            name="initialPassword"
            label={t("pos.settings.newPassword")}
            type="password"
          />
          <FormSelect
            control={form.control}
            name="role"
            label={t("pos.users.role")}
            options={ROLE_OPTIONS.map((role) => ({
              value: role,
              label: managedUserRoleLabel(role, t),
            }))}
          />
          <FormSelect
            control={form.control}
            name="defaultBranchId"
            label={t("pos.stock.branch")}
            options={accessibleBranches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
          <FormTextField
            control={form.control}
            name="maxAllowedDevices"
            label={t("pos.settings.allowedDevices")}
            type="number"
            min={1}
          />
          <ApiErrorAlert error={mutation.error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pos.common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t("pos.users.createSubmit")}
            </Button>
          </div>
        </form>
      </Form>
    </PosModal>
  );
}

function EditUserModal({
  user,
  onClose,
  updateMutation,
  resetPasswordMutation,
}: {
  user: ManagedUser;
  onClose: () => void;
  updateMutation: ReturnType<typeof useManagedUserMutations>["update"];
  resetPasswordMutation: ReturnType<typeof useManagedUserMutations>["resetPassword"];
}) {
  const { t } = useTranslation();
  const { accessibleBranches } = useBranch();
  const schema = useMemo(() => editUserSchema(t), [t]);
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user.username,
      displayName: user.displayName ?? "",
      role: user.role,
      defaultBranchId: user.defaultBranchId,
      maxAllowedDevices: user.maxAllowedDevices,
      isActive: user.isActive ? "true" : "false",
      newPassword: "",
    },
  });

  useEffect(() => {
    form.reset({
      username: user.username,
      displayName: user.displayName ?? "",
      role: user.role,
      defaultBranchId: user.defaultBranchId,
      maxAllowedDevices: user.maxAllowedDevices,
      isActive: user.isActive ? "true" : "false",
      newPassword: "",
    });
  }, [user, form]);

  const isPending = updateMutation.isPending || resetPasswordMutation.isPending;
  const error = updateMutation.error ?? resetPasswordMutation.error;

  async function onSubmit(values: EditUserFormValues) {
    await updateMutation.mutateAsync({
      id: user.id,
      input: {
        username: values.username,
        displayName: values.displayName?.trim() || null,
        role: values.role,
        defaultBranchId: values.defaultBranchId,
        maxAllowedDevices: values.maxAllowedDevices,
        isActive: values.isActive === "true",
      },
    });

    const password = values.newPassword?.trim();
    if (password && password.length >= 8) {
      await resetPasswordMutation.mutateAsync({
        id: user.id,
        password,
      });
    }

    onClose();
    updateMutation.reset();
    resetPasswordMutation.reset();
  }

  return (
    <PosModal
      onClose={onClose}
      title={t("pos.users.editTitle", { username: user.username })}
      closeLabel={t("pos.common.close")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormTextField
            control={form.control}
            name="username"
            label={t("pos.users.username")}
          />
          <FormTextField
            control={form.control}
            name="displayName"
            label={t("pos.users.displayName")}
          />
          <p className="text-xs text-muted-foreground">
            {t("pos.users.usernameChangeNote")}
          </p>
          <FormSelect
            control={form.control}
            name="role"
            label={t("pos.users.role")}
            options={ROLE_OPTIONS.map((role) => ({
              value: role,
              label: managedUserRoleLabel(role, t),
            }))}
          />
          <FormSelect
            control={form.control}
            name="defaultBranchId"
            label={t("pos.stock.branch")}
            options={accessibleBranches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
          <FormTextField
            control={form.control}
            name="maxAllowedDevices"
            label={t("pos.settings.allowedDevices")}
            type="number"
            min={1}
          />
          <FormSelect
            control={form.control}
            name="isActive"
            label={t("pos.users.status")}
            options={[
              { value: "true", label: t("pos.users.active") },
              { value: "false", label: t("pos.users.inactive") },
            ]}
          />
          <FormTextField
            control={form.control}
            name="newPassword"
            label={t("pos.users.newPasswordOptional")}
            type="password"
          />
          <ApiErrorAlert error={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pos.common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </PosModal>
  );
}

function SessionsModal({
  userId,
  onClose,
  revokeMutation,
}: {
  userId: string;
  onClose: () => void;
  revokeMutation: ReturnType<typeof useManagedUserMutations>["revokeSession"];
}) {
  const { t } = useTranslation();
  const query = useManagedUser(userId);
  const [revokingSession, setRevokingSession] = useState<ManagedUserSession | null>(
    null,
  );

  const user = query.data;
  const sessions = user?.sessions ?? [];

  function confirmRevoke() {
    if (!revokingSession) return;
    revokeMutation.mutate(
      { sessionId: revokingSession.id, userId },
      { onSuccess: () => setRevokingSession(null) },
    );
  }

  return (
    <>
      <PosModal
        onClose={onClose}
        title={
          user
            ? t("pos.users.sessionsTitle", {
                username: user.displayName?.trim() || user.username,
              })
            : t("pos.users.viewSessions")
        }
        closeLabel={t("pos.common.close")}
        wide
      >
        {query.isLoading && (
          <p className="text-sm text-muted-foreground">{t("pos.common.loading")}</p>
        )}
        {query.isError && (
          <ErrorState
            message={getApiErrorMessage(query.error, t("pos.users.sessionsLoadError"))}
          />
        )}
        {!query.isLoading && sessions.length === 0 && (
          <EmptyState message={t("pos.users.noSessions")} />
        )}
        {sessions.length > 0 && (
          <PosDataTable>
            <PosTable>
              <PosTableHead>
                <PosTableRow>
                  <PosTableHeaderCell>{t("pos.users.device")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.users.loggedInAt")}</PosTableHeaderCell>
                  <PosTableHeaderCell>{t("pos.users.expiresAt")}</PosTableHeaderCell>
                  <PosTableHeaderCell />
                </PosTableRow>
              </PosTableHead>
              <PosTableBody>
                {sessions.map((session) => (
                  <PosTableRow key={session.id}>
                    <PosTableCell className="font-medium">
                      {session.deviceLabel || t("pos.users.unknownDevice")}
                    </PosTableCell>
                    <PosTableCell>{formatDateTime(session.createdAt)}</PosTableCell>
                    <PosTableCell>{formatDateTime(session.expiresAt)}</PosTableCell>
                    <PosTableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRevokingSession(session)}
                        disabled={revokeMutation.isPending}
                      >
                        {t("pos.users.revoke")}
                      </Button>
                    </PosTableCell>
                  </PosTableRow>
                ))}
              </PosTableBody>
            </PosTable>
          </PosDataTable>
        )}
        <ApiErrorAlert error={revokeMutation.error} />
      </PosModal>

      {revokingSession && (
        <DeleteConfirmModal
          onClose={() => setRevokingSession(null)}
          onConfirm={confirmRevoke}
          title={t("pos.users.revokeTitle")}
          message={t("pos.users.revokeDescription", {
            device: revokingSession.deviceLabel ?? t("pos.users.unknownDevice"),
          })}
          confirmLabel={t("pos.users.revoke")}
          cancelLabel={t("pos.common.cancel")}
          closeLabel={t("pos.common.close")}
          isPending={revokeMutation.isPending}
        />
      )}
    </>
  );
}
