"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Loader2 } from "lucide-react";
import {
  type ComponentType,
  type ReactNode,
  useActionState,
  useState,
} from "react";
import { toast } from "sonner";
import { useActionResult } from "@/hooks/use-action-result";
import type { ActionResult } from "@/lib/auth/auth";

interface BulkConfirmDialogProps<TItem extends { id: string }, TData> {
  action: (
    prevState: ActionResult<TData> | null,
    formData: FormData
  ) => Promise<ActionResult<TData>>;
  cancelLabel: string;
  confirmLabel: string;
  description: ReactNode;
  errorTitle: string;
  fullWidthConfirm?: boolean;
  items: TItem[];
  onSuccess: () => void;
  pendingLabel: string;
  renderItem: (item: TItem) => ReactNode;
  successDescription: (data: TData | undefined) => string;
  successTitle: string;
  title: string;
  triggerIcon: ComponentType<{ className?: string }>;
  triggerLabel: string;
}

export function BulkConfirmDialog<TItem extends { id: string }, TData>({
  action,
  cancelLabel,
  confirmLabel,
  description,
  errorTitle,
  fullWidthConfirm,
  items,
  onSuccess,
  pendingLabel,
  renderItem,
  successDescription,
  successTitle,
  title,
  triggerIcon: TriggerIcon,
  triggerLabel,
}: BulkConfirmDialogProps<TItem, TData>) {
  const [open, setOpen] = useState(false);
  const count = items.length;

  const [state, formAction, isPending] = useActionState(action, null);

  useActionResult(state, {
    onError: (error) =>
      toast.error(errorTitle, {
        description: error ?? "Something went wrong",
      }),
    onSuccess: (data) => {
      toast.success(successTitle, { description: successDescription(data) });
      setOpen(false);
      onSuccess();
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button
        disabled={count === 0}
        onClick={() => setOpen(true)}
        size="sm"
        variant="destructive"
      >
        <TriggerIcon className="mr-2 size-4" />
        {triggerLabel} ({count})
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[200px] overflow-y-auto rounded-md border p-2">
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li className="flex items-center gap-2" key={item.id}>
                {renderItem(item)}
              </li>
            ))}
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <form action={formAction}>
            <Button
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                fullWidthConfirm && "w-full"
              )}
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
