"use client";

import Modal from "@/components/Modal";

type Props = {
  isOpen: boolean;
  itemName?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityLabel: string;
};

export default function DeleteWarningModal({
  isOpen,
  itemName,
  pending,
  onClose,
  onConfirm,
  entityLabel,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !pending && onClose()}
      title={`Archive ${entityLabel}?`}
      maxWidth="max-w-[420px]"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900">
          <strong>
            Warning: Permanent Deletion. <br />
          </strong>{" "}
           Deleting <strong>{itemName}</strong> will permanently
          remove all associated data and history. This action cannot be undone.
          Proceed at your own risk.
        </div>
        <p className="text-sm leading-6 text-slate-600">
         Do you want to proceed with this deletion?
        </p>
        <div className="mt-2 flex justify-end gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Deleting..." : `Delete ${entityLabel}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
