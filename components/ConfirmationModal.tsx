"use client";

import Modal from "@/components/Modal";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  danger?: boolean;
};

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
  pending = false,
  danger = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !pending && onClose()}
      showCloseButton={false}
      maxWidth="max-w-[430px]"
    >
      <div className="text-center">
        <div className={`mx-auto grid size-14 place-items-center rounded-2xl ${danger ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#f97316]"}`}>
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.5m0 3h.01M10.3 4.8 2.9 17.5A1.7 1.7 0 0 0 4.4 20h15.2a1.7 1.7 0 0 0 1.5-2.5L13.7 4.8a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#0c4a6e]">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-7 flex justify-center gap-3">
          <button type="button" onClick={onClose} disabled={pending} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#f97316] hover:bg-[#ea580c]"}`}>
            {pending ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
