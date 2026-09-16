"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  variant?: "default" | "wide" | "gallery";
};

export default function Modal({ title, subtitle, children, onClose, variant = "default" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);

  return (
    <dialog ref={ref} className={`modal modal--${variant}`} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-inner">
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        <div className="modal-heading"><p className="eyebrow">HIRAYA SUITES</p><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {children}
      </div>
    </dialog>
  );
}
