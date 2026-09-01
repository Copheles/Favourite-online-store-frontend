import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
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
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { TableSkeleton } from "@/components/shared/pos/TableSkeleton";
import {
  useBranchAdminMutations,
  useManagedBranches,
} from "@/hooks/useBranchAdmin";
import type { ManagedBranch } from "@/apis/branchAdmin.api";

const createBranchSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("pos.validation.nameRequired")),
    code: z
      .string()
      .trim()
      .min(2, t("pos.branches.codeMin"))
      .max(32, t("pos.validation.max64"))
      .regex(/^[A-Za-z0-9_]+$/, t("pos.branches.codeFormat")),
    address: z.string().max(128, t("pos.validation.max128")).optional().or(z.literal("")),
    phone: z.string().max(64, t("pos.validation.max64")).optional().or(z.literal("")),
  });

type CreateBranchFormValues = z.infer<ReturnType<typeof createBranchSchema>>;

const editBranchSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("pos.validation.nameRequired")),
    address: z.string().max(128, t("pos.validation.max128")).optional().or(z.literal("")),
    phone: z.string().max(64, t("pos.validation.max64")).optional().or(z.literal("")),
    isActive: z.enum(["true", "false"]),
  });

type EditBranchFormValues = z.infer<ReturnType<typeof editBranchSchema>>;

export function BranchManagementPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ManagedBranch | null>(null);
  const query = useManagedBranches();
  const mutations = useBranchAdminMutations();
  const rows = query.data ?? [];

  return (
    <PosPageShell>
      <PageHeader
        title={t("pos.modules.branchManagement")}
        description={t("pos.branches.description")}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("pos.branches.add")}
          </Button>
        }
      />

      {query.isLoading && !query.data && <TableSkeleton />}
      {query.isError && <ErrorState message={t("pos.branches.loadError")} />}
      {!query.isLoading && rows.length === 0 && (
        <EmptyState message={t("pos.branches.empty")} />
      )}

      {!query.isLoading && rows.length > 0 && (
        <PosDataTable>
          <PosTable>
            <PosTableHead>
              <PosTableRow>
                <PosTableHeaderCell>{t("pos.branches.code")}</PosTableHeaderCell>
                <PosTableHeaderCell>{t("pos.branches.name")}</PosTableHeaderCell>
                <PosTableHeaderCell>{t("pos.branches.address")}</PosTableHeaderCell>
                <PosTableHeaderCell>{t("pos.branches.phone")}</PosTableHeaderCell>
                <PosTableHeaderCell>{t("pos.users.status")}</PosTableHeaderCell>
                <PosTableHeaderCell />
              </PosTableRow>
            </PosTableHead>
            <PosTableBody>
              {rows.map((row) => (
                <PosTableRow key={row.id}>
                  <PosTableCell className="font-mono text-sm">{row.code}</PosTableCell>
                  <PosTableCell className="font-medium">{row.name}</PosTableCell>
                  <PosTableCell>{row.address || "-"}</PosTableCell>
                  <PosTableCell>{row.phone || "-"}</PosTableCell>
                  <PosTableCell>
                    {row.isActive ? t("pos.users.active") : t("pos.users.inactive")}
                  </PosTableCell>
                  <PosTableCell>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBranch(row)}
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
      )}

      {createOpen && (
        <CreateBranchModal
          onClose={() => setCreateOpen(false)}
          mutation={mutations.create}
        />
      )}

      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          mutation={mutations.update}
        />
      )}
    </PosPageShell>
  );
}

function CreateBranchModal({
  onClose,
  mutation,
}: {
  onClose: () => void;
  mutation: ReturnType<typeof useBranchAdminMutations>["create"];
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => createBranchSchema(t), [t]);
  const form = useForm<CreateBranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
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
      title={t("pos.branches.createTitle")}
      closeLabel={t("pos.common.close")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate({
              name: values.name.trim(),
              code: values.code.trim().toUpperCase(),
              address: values.address?.trim() || undefined,
              phone: values.phone?.trim() || undefined,
            }),
          )}
          className="space-y-3"
        >
          <FormTextField control={form.control} name="name" label={t("pos.branches.name")} />
          <FormTextField
            control={form.control}
            name="code"
            label={t("pos.branches.code")}
          />
          <FormTextField
            control={form.control}
            name="address"
            label={t("pos.branches.address")}
          />
          <FormTextField control={form.control} name="phone" label={t("pos.branches.phone")} />
          <p className="text-xs text-muted-foreground">
            {t("pos.branches.receiptFieldsHint")}
          </p>
          <ApiErrorAlert error={mutation.error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pos.common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t("pos.branches.createSubmit")}
            </Button>
          </div>
        </form>
      </Form>
    </PosModal>
  );
}

function EditBranchModal({
  branch,
  onClose,
  mutation,
}: {
  branch: ManagedBranch;
  onClose: () => void;
  mutation: ReturnType<typeof useBranchAdminMutations>["update"];
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => editBranchSchema(t), [t]);
  const form = useForm<EditBranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      isActive: branch.isActive ? "true" : "false",
    },
  });

  useEffect(() => {
    form.reset({
      name: branch.name,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      isActive: branch.isActive ? "true" : "false",
    });
  }, [branch, form]);

  return (
    <PosModal
      onClose={onClose}
      title={t("pos.branches.editTitle", { name: branch.name })}
      closeLabel={t("pos.common.close")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(
              {
                id: branch.id,
                input: {
                  name: values.name.trim(),
                  address: values.address?.trim() || null,
                  phone: values.phone?.trim() || null,
                  isActive: values.isActive === "true",
                },
              },
              { onSuccess: onClose },
            ),
          )}
          className="space-y-3"
        >
          <FormTextField
            control={form.control}
            name="name"
            label={t("pos.branches.name")}
          />
          <div>
            <p className="mb-1 text-sm font-medium">{t("pos.branches.code")}</p>
            <p className="rounded-md border border-border/70 bg-muted/40 px-3 py-2 font-mono text-sm">
              {branch.code}
            </p>
          </div>
          <FormTextField
            control={form.control}
            name="address"
            label={t("pos.branches.address")}
          />
          <FormTextField control={form.control} name="phone" label={t("pos.branches.phone")} />
          <p className="text-xs text-muted-foreground">
            {t("pos.branches.receiptFieldsHint")}
          </p>
          <FormSelect
            control={form.control}
            name="isActive"
            label={t("pos.users.status")}
            options={[
              { value: "true", label: t("pos.users.active") },
              { value: "false", label: t("pos.users.inactive") },
            ]}
          />
          <ApiErrorAlert error={mutation.error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pos.common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </PosModal>
  );
}
