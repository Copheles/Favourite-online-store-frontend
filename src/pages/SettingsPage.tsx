import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ApiErrorAlert } from "@/components/forms/ApiErrorAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormTextareaField } from "@/components/forms/FormTextareaField";
import { FormSelect } from "@/components/forms/FormSelect";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { SettingsAccordionSection } from "@/components/settings/SettingsAccordionSection";
import { SettingsToolbar } from "@/components/settings/SettingsToolbar";
import { ProductExcelPanel } from "@/components/forms/ProductExcelPanel";
import { getStoreSettings, updateStoreSettings } from "@/apis/settings.api";
import { updateCurrentBranchShopInfo } from "@/apis/branch.api";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";
import { useAdminMutations } from "@/hooks/useAdmin";
import { useReceiptPrintSettings } from "@/hooks/useReceiptPrintSettings";
import { FALLBACK_PAPER_WIDTH_MM } from "@/lib/printSettingsStorage";
import {
  formValuesToSetting,
  settingToFormValues,
} from "@/lib/receiptPaperSettingsForm";
import { queryKeys } from "@/lib/queryKeys";
import { useAppDispatch } from "@/redux/hooks";
import { updateBranchDetails } from "@/redux/slices/branchSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBranchShopSettingsSchema,
  getPasswordSchema,
  getPointsSettingsSchema,
  getReceiptPaperSchema,
  getShopSettingsSchema,
  RECEIPT_PAPER_WIDTH_PRESETS,
  type PasswordFormValues,
  type PointsSettingsFormValues,
  type ReceiptPaperFormValues,
  type BranchShopSettingsFormValues,
  type ShopSettingsFormValues,
} from "@/validation/settings.validation";

type SettingsSectionId =
  | "general"
  | "localDevice"
  | "branchReceiptInfo"
  | "shopInfo"
  | "featureControl"
  | "excelImport";

function SuccessNote({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground">
      <CheckCircle2 className="size-4 shrink-0" />
      {message}
    </p>
  );
}

export function SettingsPage() {
  const { hasStoreOperatorAccess, isSuperAdmin } = useAuth();
  const [openSections, setOpenSections] = useState<
    Record<SettingsSectionId, boolean>
  >({
    general: false,
    localDevice: false,
    branchReceiptInfo: false,
    shopInfo: false,
    featureControl: false,
    excelImport: false,
  });

  const setSectionOpen = useCallback((id: SettingsSectionId, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  }, []);

  const openSection = useCallback((id: SettingsSectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
  }, []);

  return (
    <PosPageShell>
      <div className="mx-auto max-w-2xl">
        <SettingsToolbar
          showAdminShortcuts={hasStoreOperatorAccess}
          onOpenDevice={() => openSection("localDevice")}
          onOpenShop={() => openSection("shopInfo")}
        />

        <div className="settings-accordion-stack">
          <GeneralSettingsSection
            open={openSections.general}
            onOpenChange={(open) => setSectionOpen("general", open)}
          />

          {hasStoreOperatorAccess && (
            <>
              <LocalDeviceSettingsSection
                open={openSections.localDevice}
                onOpenChange={(open) => setSectionOpen("localDevice", open)}
              />
              <BranchReceiptInfoSettingsSection
                open={openSections.branchReceiptInfo}
                onOpenChange={(open) => setSectionOpen("branchReceiptInfo", open)}
              />
              <ShopInfoSettingsSection
                open={openSections.shopInfo}
                onOpenChange={(open) => setSectionOpen("shopInfo", open)}
              />
              <FeatureControlSettingsSection
                open={openSections.featureControl}
                onOpenChange={(open) => setSectionOpen("featureControl", open)}
              />
            </>
          )}

          {isSuperAdmin && (
            <ExcelImportSettingsSection
              open={openSections.excelImport}
              onOpenChange={(open) => setSectionOpen("excelImport", open)}
            />
          )}
        </div>
      </div>
    </PosPageShell>
  );
}

function GeneralSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { canWrite } = useAuth();
  const mutations = useAdminMutations();
  const mutation = mutations.changePassword;
  const schema = useMemo(() => getPasswordSchema(t), [t]);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (mutation.isSuccess) form.reset();
  }, [mutation.isSuccess, form]);

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.general")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          <FormTextField
            control={form.control}
            name="currentPassword"
            label={t("pos.settings.currentPassword")}
            type="password"
          />
          <FormTextField
            control={form.control}
            name="newPassword"
            label={t("pos.settings.newPassword")}
            type="password"
          />
          {mutation.isSuccess && (
            <SuccessNote message={t("pos.settings.passwordUpdated")} />
          )}
          <ApiErrorAlert error={mutation.error} />
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={!canWrite || mutation.isPending}>
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function LocalDeviceSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [savedLocally, setSavedLocally] = useState(false);
  const { setting, paperWidthMm, shopDefaultWidthMm, save, reset } =
    useReceiptPrintSettings();

  const schema = useMemo(() => getReceiptPaperSchema(t), [t]);

  const form = useForm<ReceiptPaperFormValues>({
    resolver: zodResolver(schema),
    values: settingToFormValues(setting),
  });

  const mode = form.watch("mode");

  const paperModeOptions = useMemo(
    () => [
      {
        value: "shopDefault",
        label: t("pos.settings.receiptPaperShopDefault", {
          width: shopDefaultWidthMm ?? FALLBACK_PAPER_WIDTH_MM,
        }),
      },
      ...RECEIPT_PAPER_WIDTH_PRESETS.map((width) => ({
        value: String(width),
        label: t(`pos.settings.receiptPaperWidthOption${width}`),
      })),
      { value: "a4", label: t("pos.settings.receiptPaperOptionA4") },
      { value: "custom", label: t("pos.settings.receiptPaperOptionCustom") },
    ],
    [t, shopDefaultWidthMm],
  );

  const shopDefaultMutation = useMutation({
    mutationFn: updateStoreSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.store(), data);
    },
  });

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.localDevice")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            save(formValuesToSetting(values));
            setSavedLocally(true);
          })}
          className="mx-auto max-w-md space-y-3"
        >
          <FormSelect
            control={form.control}
            name="mode"
            label={t("pos.settings.receiptPaperWidth")}
            options={paperModeOptions}
          />
          {mode === "custom" && (
            <FormTextField
              control={form.control}
              name="customWidthMm"
              label={t("pos.settings.receiptPaperCustomWidth")}
              type="number"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {t("pos.settings.receiptPaperDeviceOnlyHint")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("pos.settings.receiptPaperWidthHint")}
          </p>
          {savedLocally && (
            <SuccessNote message={t("pos.settings.deviceSettingsSaved")} />
          )}
          {shopDefaultMutation.isSuccess && (
            <SuccessNote message={t("pos.settings.shopDefaultPaperSaved")} />
          )}
          <ApiErrorAlert error={shopDefaultMutation.error} />
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSavedLocally(false);
                shopDefaultMutation.reset();
              }}
            >
              {t("pos.settings.receiptPaperReset")}
            </Button>
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                disabled={shopDefaultMutation.isPending}
                onClick={() => {
                  setSavedLocally(false);
                  shopDefaultMutation.mutate({
                    receiptPaperWidthMm: paperWidthMm,
                  });
                }}
              >
                {t("pos.settings.receiptPaperSetShopDefault")}
              </Button>
            )}
            <Button type="submit">{t("pos.common.save")}</Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function BranchReceiptInfoSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const schema = useMemo(() => getBranchShopSettingsSchema(t), [t]);

  const form = useForm<BranchShopSettingsFormValues>({
    resolver: zodResolver(schema),
    values: {
      name: currentBranch?.name ?? "",
      address: currentBranch?.address ?? "",
      phone: currentBranch?.phone ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateCurrentBranchShopInfo,
    onSuccess: (branch) => {
      dispatch(updateBranchDetails(branch));
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.accessible() });
    },
  });

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.branchReceiptInfo")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          {currentBranch?.code ? (
            <p className="text-sm text-muted-foreground">
              {t("pos.settings.branchReceiptBranchLabel", {
                code: currentBranch.code,
              })}
            </p>
          ) : null}
          <FormTextField
            control={form.control}
            name="name"
            label={t("pos.settings.shopName")}
          />
          <FormTextareaField
            control={form.control}
            name="address"
            label={t("pos.settings.shopAddress")}
            rows={3}
          />
          <FormTextField
            control={form.control}
            name="phone"
            label={t("pos.settings.shopPhone")}
            placeholder={t("pos.settings.shopPhonePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("pos.settings.branchReceiptHint")}
          </p>
          {mutation.isSuccess && (
            <SuccessNote message={t("pos.settings.branchReceiptSaved")} />
          )}
          <ApiErrorAlert error={mutation.error} />
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={mutation.isPending || !currentBranch}
            >
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function ShopInfoSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.store(),
    queryFn: getStoreSettings,
  });

  const schema = useMemo(
    () =>
      getShopSettingsSchema(t).pick({
        shopName: true,
        shopAddress: true,
        shopPhone: true,
      }),
    [t],
  );

  const form = useForm<
    Pick<ShopSettingsFormValues, "shopName" | "shopAddress" | "shopPhone">
  >({
    resolver: zodResolver(schema),
    values: {
      shopName: settingsQuery.data?.shopName ?? "",
      shopAddress: settingsQuery.data?.shopAddress ?? "",
      shopPhone: settingsQuery.data?.shopPhone ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateStoreSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.store(), data);
    },
  });

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.shopInfo")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          <FormTextField
            control={form.control}
            name="shopName"
            label={t("pos.settings.shopName")}
          />
          <FormTextareaField
            control={form.control}
            name="shopAddress"
            label={t("pos.settings.shopAddress")}
            rows={3}
          />
          <FormTextField
            control={form.control}
            name="shopPhone"
            label={t("pos.settings.shopPhone")}
            placeholder={t("pos.settings.shopPhonePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("pos.settings.shopHint")}
          </p>
          {mutation.isSuccess && (
            <SuccessNote message={t("pos.settings.shopSettingsSaved")} />
          )}
          <ApiErrorAlert error={mutation.error || settingsQuery.error} />
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={mutation.isPending || settingsQuery.isLoading}
            >
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function FeatureControlSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const schema = useMemo(() => getPointsSettingsSchema(t), [t]);
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.store(),
    queryFn: getStoreSettings,
  });

  const form = useForm<PointsSettingsFormValues>({
    resolver: zodResolver(schema),
    values: {
      pointsCashbackPercent: settingsQuery.data?.pointsCashbackPercent ?? 0.1,
    },
  });

  const mutation = useMutation({
    mutationFn: updateStoreSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.store(), data);
    },
  });

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.featureControl")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          <FormTextField
            control={form.control}
            name="pointsCashbackPercent"
            label={t("pos.settings.pointsCashbackPercent")}
            type="number"
            min={0}
          />
          <p className="text-xs text-muted-foreground">
            {t("pos.settings.pointsCashbackHint")}
          </p>
          {mutation.isSuccess && (
            <SuccessNote message={t("pos.settings.pointsSettingsSaved")} />
          )}
          <ApiErrorAlert error={mutation.error || settingsQuery.error} />
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={mutation.isPending || settingsQuery.isLoading}
            >
              {t("pos.common.save")}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function ExcelImportSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <SettingsAccordionSection
      title={t("pos.settings.sections.excelImport")}
      open={open}
      onOpenChange={onOpenChange}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {t("pos.settings.excelImportDescription")}
      </p>
      <ProductExcelPanel />
    </SettingsAccordionSection>
  );
}
