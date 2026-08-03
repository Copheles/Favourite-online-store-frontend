import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormTextareaField } from "@/components/forms/FormTextareaField";
import { PosModal } from "@/components/shared/pos/PosModal";
import { ProductCombobox } from "@/components/shared/pos/ProductCombobox";
import { useBranch } from "@/hooks/useBranch";
import { useStockMovementMutation } from "@/hooks/useStock";
import { todayISO } from "@/lib/format";
import {
  getStockMovementSchema,
  type StockMovementFormValues,
} from "@/validation/stock.validation";

export interface RestockInitialProduct {
  productId: string;
  name: string;
  code: string;
}

interface RestockModalProps {
  onClose: () => void;
  initialProduct?: RestockInitialProduct;
  onSuccess?: () => void;
}

export function RestockModal({
  onClose,
  initialProduct,
  onSuccess,
}: RestockModalProps) {
  const { t } = useTranslation();
  const mutation = useStockMovementMutation();
  const { accessibleBranches, defaultBranchId, currentBranchId } = useBranch();
  const [selectedLabel, setSelectedLabel] = useState(
    initialProduct ? `${initialProduct.name} (${initialProduct.code})` : "",
  );

  const branchOptions = useMemo(
    () =>
      accessibleBranches.map((branch) => {
        const base = `${branch.name} (${branch.code})`;
        const isHome = branch.id === defaultBranchId;
        return {
          value: branch.id,
          label: isHome ? `${base} · ${t("pos.stock.saleHome")}` : base,
        };
      }),
    [accessibleBranches, defaultBranchId, t],
  );

  const schema = useMemo(() => getStockMovementSchema(t), [t]);
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: initialProduct?.productId ?? "",
      branchId: currentBranchId ?? defaultBranchId ?? accessibleBranches[0]?.id ?? "",
      type: "IN",
      quantity: 1,
      buyPrice: null,
      purchaseDate: todayISO(),
      note: "",
    },
  });

  const formBranchId = form.watch("branchId");
  const prevBranchRef = useRef(formBranchId);

  useEffect(() => {
    if (initialProduct) return;
    if (prevBranchRef.current === formBranchId) return;
    prevBranchRef.current = formBranchId;
    form.setValue("productId", "");
    setSelectedLabel("");
  }, [formBranchId, form, initialProduct]);

  function onSubmit(values: StockMovementFormValues) {
    mutation.mutate(
      {
        productId: values.productId,
        branchId: values.branchId,
        type: "IN",
        quantity: values.quantity,
        buyPrice: values.buyPrice ?? null,
        purchaseDate: values.purchaseDate,
        note: values.note || null,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      },
    );
  }

  return (
    <PosModal
      title={t("pos.stock.restockTitle")}
      description={t("pos.stock.restockDescription")}
      onClose={onClose}
      closeLabel={t("pos.common.cancel")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <FormSelect
              control={form.control}
              name="branchId"
              label={t("pos.stock.branch")}
              options={branchOptions}
              disabled={branchOptions.length <= 1}
            />
          </div>
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-xs font-semibold text-muted-foreground">
                  {t("pos.stock.product")}
                </FormLabel>
                <FormControl>
                  <ProductCombobox
                    value={field.value}
                    selectedLabel={selectedLabel}
                    branchId={formBranchId}
                    disabled={Boolean(initialProduct)}
                    onChange={(productId, product) => {
                      field.onChange(productId);
                      setSelectedLabel(`${product.name} (${product.code})`);
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormTextField
            control={form.control}
            name="quantity"
            label={t("pos.stock.qty")}
            type="number"
            min={1}
          />
          <FormTextField
            control={form.control}
            name="buyPrice"
            label={t("pos.stock.buyPrice")}
            type="number"
            min={0}
          />
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-xs font-semibold text-muted-foreground">
                  {t("pos.stock.purchaseDate")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <FormTextareaField
              control={form.control}
              name="note"
              label={t("pos.members.note")}
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <ApiErrorAlert error={mutation.error} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {t("pos.stock.restock")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("pos.common.cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </PosModal>
  );
}
