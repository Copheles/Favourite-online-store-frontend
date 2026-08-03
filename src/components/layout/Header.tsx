import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Notification01Icon,
  Logout01Icon,
  UserIcon,
  Settings01Icon,
  Menu01Icon,
  Moon02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuToggle: () => void;
  pageTitle: string;
}

export function Header({ onMenuToggle, pageTitle }: HeaderProps) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logoutMutation.mutate();
  }

  function toggleLanguage() {
    const nextLang = i18n.language === "my" ? "en" : "my";
    i18n.changeLanguage(nextLang);
  }

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  const ThemeIcon =
    resolvedTheme === "dark"
      ? Moon02Icon
      : Sun02Icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      {/* Left: Menu toggle + Title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <HugeiconsIcon
            icon={Menu01Icon}
            size={20}
            strokeWidth={1.5}
            className="text-muted-foreground"
          />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right: Utilities */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t("header.searchPlaceholder")}
            className="h-9 w-64 rounded-full border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Language Switcher */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="hidden text-xs font-medium text-muted-foreground hover:text-foreground sm:flex"
        >
          {i18n.language === "my" ? "EN" : "MY"}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={t("header.theme", { theme })}
          className="text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ThemeIcon}
            size={18}
            strokeWidth={1.5}
          />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <HugeiconsIcon
            icon={Notification01Icon}
            size={20}
            strokeWidth={1.5}
          />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        </Button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-popover py-2 shadow-lg shadow-black/5 ring-1 ring-black/5">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-popover-foreground">
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={16}
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                  />
                  {t("header.profile")}
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted">
                  <HugeiconsIcon
                    icon={Settings01Icon}
                    size={16}
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                  />
                  {t("header.settings")}
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    size={16}
                    strokeWidth={1.5}
                    className="text-red-400"
                  />
                  {t("header.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
