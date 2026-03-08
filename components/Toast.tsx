"use client";

import { useEffect } from "react";
import { Zap } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex animate-[slideIn_0.3s_ease-out] items-center gap-2 rounded-2xl border-b-4 border-slate-900 bg-slate-800 px-5 py-3 font-bold text-white shadow-xl">
      <Zap className="h-4 w-4 shrink-0 text-teal-400" />
      {message}
    </div>
  );
}
