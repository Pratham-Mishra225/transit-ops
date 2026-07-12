"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelLog } from "@/types/fuel";

interface FuelDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  log: FuelLog | null;
}

export function FuelDeleteDialog({
  open,
  onClose,
  onConfirm,
  log,
}: FuelDeleteDialogProps) {
  if (!open || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">Delete Fuel Log</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Are you sure you want to delete this fuel record from{" "}
            <span className="font-medium text-foreground">
              {new Date(log.date).toLocaleDateString("en-IN")}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex items-center gap-2 mt-6 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Delete Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
