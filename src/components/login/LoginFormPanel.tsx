import { Loader2, Lock, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ApiErrorAlert,
  getApiErrorMessage,
} from "@/components/forms/ApiErrorAlert";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginField } from "@/components/login/LoginField";
import type { LoginFormValues } from "@/validation/login.validation";

interface LoginFormPanelProps {
  form: UseFormReturn<LoginFormValues>;
  onSubmit: (values: LoginFormValues) => void;
  isPending: boolean;
  error: unknown;
  showPassword: boolean;
  onTogglePassword: () => void;
}

export function LoginFormPanel({
  form,
  onSubmit,
  isPending,
  error,
  showPassword,
  onTogglePassword,
}: LoginFormPanelProps) {
  const { t } = useTranslation();

  const errorMessage = error
    ? (error as { response?: { status?: number } }).response?.status === 409
      ? t("login.deviceConflict")
      : getApiErrorMessage(error, t("login.errorFallback"))
    : null;

  return (
    <section className="flex min-h-[580px] flex-col justify-center bg-card px-6 py-10 sm:px-12 lg:px-14">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <BrandLogo compact />
      </div>

      <div className="mx-auto w-full max-w-[360px]">
        <div className="mb-8">
          <h1 className="text-[2rem] font-extrabold leading-tight text-card-foreground">
            {t("login.title")}
          </h1>
          <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
            {t("login.description")}
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                    {t("login.usernameLabel")}
                  </FormLabel>
                  <FormControl>
                    <LoginField
                      icon={User}
                      placeholder={t("login.usernamePlaceholder")}
                      autoComplete="username"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                    {t("login.passwordLabel")}
                  </FormLabel>
                  <FormControl>
                    <LoginField
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      placeholder={t("login.passwordPlaceholder")}
                      autoComplete="current-password"
                      disabled={isPending}
                      trailing={
                        <button
                          type="button"
                          onClick={onTogglePassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-primary transition-colors hover:text-primary/80"
                          aria-label={
                            showPassword
                              ? t("login.hidePassword")
                              : t("login.showPassword")
                          }
                        >
                          {showPassword ? t("login.hide") : t("login.show")}
                        </button>
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {errorMessage && (
              <ApiErrorAlert error={{ message: errorMessage }} />
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-1 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t("login.submitting")}
                </span>
              ) : (
                t("login.submit")
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-10 text-center text-xs text-muted-foreground/80">
          {t("login.footer")}
        </p>
      </div>
    </section>
  );
}
