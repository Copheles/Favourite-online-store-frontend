import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormTextareaField } from "@/components/forms/FormTextareaField";
import { PosModal } from "@/components/shared/pos/PosModal";
import type { Customer } from "@/types/api";
import {
  getCustomerSchema,
  type CustomerFormValues,
} from "@/validation/customer.validation";

export function CustomerFormModal({
  customer,
  isPending,
  error,
  onClose,
  onSubmit,
}: {
  customer?: Customer | null;
  isPending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => getCustomerSchema(t), [t]);
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      note: customer?.note ?? "",
    },
  });

  return (
    <PosModal
      title={customer ? t("pos.members.edit") : t("pos.members.add")}
      onClose={onClose}
      closeLabel={t("pos.common.close")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormTextField
            control={form.control}
            name="name"
            label={t("pos.members.name")}
          />
          <FormTextField
            control={form.control}
            name="phone"
            label={t("pos.members.phone")}
          />
          <FormTextField
            control={form.control}
            name="address"
            label={t("pos.members.address")}
          />
          <FormTextareaField
            control={form.control}
            name="note"
            label={t("pos.members.note")}
            rows={3}
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
