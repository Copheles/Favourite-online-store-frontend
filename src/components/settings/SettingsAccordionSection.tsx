import "./settings-accordion.css";

import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";

type SettingsAccordionSectionProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function SettingsAccordionSection({
  title,
  open,
  onOpenChange,
  children,
}: SettingsAccordionSectionProps) {
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange}>
      <Collapsible.Trigger className="settings-accordion-trigger">
        <span className="settings-accordion-title">{title}</span>
        <ChevronDown
          className="settings-accordion-chevron size-4"
          aria-hidden
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="settings-accordion-content">
        <div className="settings-accordion-panel">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
