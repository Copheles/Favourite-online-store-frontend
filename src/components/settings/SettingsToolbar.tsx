import "./settings-accordion.css";

import { Printer, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type SettingsToolbarProps = {
  showAdminShortcuts?: boolean;
  onOpenDevice?: () => void;
  onOpenShop?: () => void;
};

function getRoleLabel(
  role: string | undefined,
  t: (key: string) => string,
): string {
  switch (role?.toLowerCase()) {
    case "super_admin":
      return t("pos.settings.roles.superAdmin");
    case "owner":
      return t("pos.settings.roles.owner");
    case "admin":
      return t("pos.settings.roles.admin");
    case "staff":
      return t("pos.settings.roles.staff");
    case "monitor":
      return t("pos.settings.roles.monitor");
    default:
      return t("pos.settings.roles.staff");
  }
}

export function SettingsToolbar({
  showAdminShortcuts = false,
  onOpenDevice,
  onOpenShop,
}: SettingsToolbarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="settings-toolbar">
      <div className="settings-toolbar-user">
        <div className="settings-toolbar-avatar">{initials}</div>
        <span className="settings-toolbar-role">
          {getRoleLabel(user?.role, t)}
        </span>
      </div>

      {showAdminShortcuts && (
        <div className="settings-toolbar-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onOpenDevice}
            aria-label={t("pos.settings.sections.localDevice")}
          >
            <Printer className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onOpenShop}
            aria-label={t("pos.settings.sections.shopInfo")}
          >
            <Store className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
