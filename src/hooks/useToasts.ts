"use client";

import { useCallback, useRef, useState } from "react";

export interface Toast {
  id: number;
  kind: "success" | "error";
  message: string;
}

export function useToasts(duration = 4500) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: Toast["kind"], message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration],
  );

  return { toasts, notify, dismiss };
}
