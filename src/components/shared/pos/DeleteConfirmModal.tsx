import { Button } from "@/components/ui/button";
import { PosModal } from "@/components/shared/pos/PosModal";

export function DeleteConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  closeLabel,
  isPending,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <PosModal title={title} onClose={onClose} closeLabel={closeLabel}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
        >
          {confirmLabel}
        </Button>
      </div>
    </PosModal>
  );
}
