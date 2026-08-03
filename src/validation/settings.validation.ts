import { z } from "zod";
import {
  optionalString,
  paymentTypeSchema,
  staffRoleSchema,
} from "@/validation/common.validation";

export const getPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, t("pos.validation.passwordRequired")),
      newPassword: z
        .string()
        .min(6, t("pos.validation.passwordMin"))
        .max(128, t("pos.validation.max128")),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t("pos.validation.passwordDifferent"),
      path: ["newPassword"],
    });

export type PasswordFormValues = z.infer<
  ReturnType<typeof getPasswordSchema>
>;

export const getExpenseSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("pos.validation.nameRequired"))
      .max(128, t("pos.validation.max128")),
    amount: z.number().min(1, t("pos.validation.amountMin")),
    paymentType: paymentTypeSchema,
    expenseDate: z.string().min(1, t("pos.validation.dateRequired")),
    category: optionalString(64),
    note: optionalString(255),
  });

export type ExpenseFormValues = z.infer<
  ReturnType<typeof getExpenseSchema>
>;

export const getProductSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t("pos.validation.nameRequired"))
      .max(128, t("pos.validation.max128")),
    code: z
      .string()
      .min(1, t("pos.validation.codeRequired"))
      .max(64, t("pos.validation.max64")),
    barcode: optionalString(255),
    sellingPrice: z.number().min(0, t("pos.validation.minZero")),
    discount: z.number().min(0, t("pos.validation.minZero")),
    topCategoryId: z.string().min(1, t("pos.validation.categoryRequired")),
    subCategoryId: z.string().min(1, t("pos.validation.categoryRequired")),
    initialStockQty: z.number().min(0, t("pos.validation.minZero")),
    buyPrice: z.number().min(0, t("pos.validation.minZero")),
  });

export type ProductFormValues = z.infer<
  ReturnType<typeof getProductSchema>
>;

export const getStaffSchema = (t: (key: string) => string) =>
  z.object({
    username: z
      .string()
      .min(3, t("pos.validation.usernameMin"))
      .max(64, t("pos.validation.max64")),
    password: z
      .string()
      .min(6, t("pos.validation.passwordMin"))
      .max(128, t("pos.validation.max128")),
    role: staffRoleSchema,
  });

export type StaffFormValues = z.infer<ReturnType<typeof getStaffSchema>>;

export const getPointsSettingsSchema = (t: (key: string) => string) =>
  z.object({
    pointsCashbackPercent: z
      .number()
      .min(0, t("pos.validation.minZero"))
      .max(100, t("pos.validation.max100")),
  });

export type PointsSettingsFormValues = z.infer<
  ReturnType<typeof getPointsSettingsSchema>
>;

export const RECEIPT_PAPER_WIDTH_PRESETS = [58, 65, 80] as const;
export type ReceiptPaperWidthPreset =
  (typeof RECEIPT_PAPER_WIDTH_PRESETS)[number];

/** @deprecated use RECEIPT_PAPER_WIDTH_PRESETS */
export const RECEIPT_PAPER_WIDTH_OPTIONS = RECEIPT_PAPER_WIDTH_PRESETS;
export type ReceiptPaperWidthOption = ReceiptPaperWidthPreset;

export const RECEIPT_PAPER_MODES = [
  "shopDefault",
  "58",
  "65",
  "80",
  "a4",
  "custom",
] as const;
export type ReceiptPaperMode = (typeof RECEIPT_PAPER_MODES)[number];

export const getReceiptPaperSchema = (t: (key: string) => string) =>
  z.object({
    mode: z.enum(RECEIPT_PAPER_MODES),
    customWidthMm: z
      .number({ message: t("pos.validation.numberRequired") })
      .min(30, t("pos.validation.paperWidthRange"))
      .max(120, t("pos.validation.paperWidthRange")),
  });

export type ReceiptPaperFormValues = z.infer<
  ReturnType<typeof getReceiptPaperSchema>
>;

export const getShopSettingsSchema = (t: (key: string) => string) =>
  z.object({
    shopName: z
      .string()
      .min(1, t("pos.validation.nameRequired"))
      .max(128, t("pos.validation.max128")),
    shopAddress: z.string().max(255, t("pos.validation.max128")).optional().or(z.literal("")),
    shopPhone: z.string().max(128, t("pos.validation.max128")).optional().or(z.literal("")),
  });

export type ShopSettingsFormValues = z.infer<
  ReturnType<typeof getShopSettingsSchema>
>;

export const productFormDefaults: ProductFormValues = {
  name: "",
  code: "",
  barcode: "",
  sellingPrice: 0,
  discount: 0,
  topCategoryId: "",
  subCategoryId: "",
  initialStockQty: 1,
  buyPrice: 0,
};
