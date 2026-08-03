import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { useAuth } from "@/hooks/useAuth";
import { usePrefetchCurrentOrders, useCurrentOrderCount } from "@/hooks/useOrders";
import { getVisiblePosModules } from "@/lib/accessControl";

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const currentOrderCountQuery = useCurrentOrderCount();
  const prefetchCurrentOrders = usePrefetchCurrentOrders();

  useEffect(() => {
    prefetchCurrentOrders();
  }, [prefetchCurrentOrders]);

  const visibleModules = getVisiblePosModules(user?.role);

  const modules = visibleModules.map((module) =>
    module.id === "currentOrder" && currentOrderCountQuery.data
      ? { ...module, badge: currentOrderCountQuery.data }
      : module,
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <section className="px-3 pt-4 sm:px-5 sm:pt-5 md:px-6 lg:px-8 lg:pt-6">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1e40af_0%,#2563eb_50%,#3b82f6_100%)] px-6 py-7 shadow-card-hover sm:px-8 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 right-24 size-44 rounded-full bg-white/10"
          />
          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              {t("pos.header.home")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
              {t("pos.home.greeting", { name: user?.username ?? "" })}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/75 sm:text-[15px]">
              {t("pos.home.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col px-3 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8 lg:py-6">
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {modules.map((module) => (
            <ModuleTile key={module.id} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}
