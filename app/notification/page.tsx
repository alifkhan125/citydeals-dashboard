"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import Link from "next/link";
import {
  useNotificationAreas,
  useNotificationUsers,
  useSendNotification,
} from "@/hooks/useNotifications";

const birthdayOfferCategories = [
  "Birthday Perks",
  "Food",
  "Cafe",
  "Beauty",
  "Shopping",
  "Entertainment",
];

export default function SendNotificationPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "AREA" | "USER">("ALL");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sendMode, setSendMode] = useState<"NOW" | "SCHEDULED">("NOW");
  const [scheduledAt, setScheduledAt] = useState("");
  const [repeatMode, setRepeatMode] = useState<"NONE" | "DAILY" | "WEEKLY">("NONE");

  const { data: areas = [] } = useNotificationAreas();
  const { data: users = [] } = useNotificationUsers();
  const sendNotificationMutation = useSendNotification();
  const sending = sendNotificationMutation.isPending;

  // Birthday Perks
  const [birthdayPerksEnabled, setBirthdayPerksEnabled] = useState(true);
  const [birthdayCategory, setBirthdayCategory] = useState(birthdayOfferCategories[0]);
  const [birthdayLeadTime, setBirthdayLeadTime] = useState("On birthday");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(text: string) {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  }

  useEffect(() => {
    if (!selectedAreaId && areas[0]?.id) setSelectedAreaId(areas[0].id);
  }, [areas, selectedAreaId]);

  useEffect(() => {
    if (!selectedUserId && users[0]?.id) setSelectedUserId(users[0].id);
  }, [users, selectedUserId]);

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
      if (typeof error.response?.data?.error === "string") return error.response.data.error;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  }

  async function handleSendNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      showToast("Please enter a notification title");
      return;
    }
    if (!message.trim()) {
      showToast("Please enter a notification message");
      return;
    }

    if (targetType === "AREA" && !selectedAreaId) {
      showToast("Please select a target area");
      return;
    }

    if (targetType === "USER" && !selectedUserId) {
      showToast("Please select a target user");
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        body: message.trim(),
        sendTo: targetType,
        ...(targetType === "AREA" ? { areaId: selectedAreaId } : {}),
        ...(targetType === "USER" ? { userId: selectedUserId } : {}),
        ...(sendMode === "SCHEDULED" && scheduledAt
          ? { scheduledAt: new Date(scheduledAt).toISOString() }
          : {}),
        repeat: repeatMode,
      };

      const res = await sendNotificationMutation.mutateAsync(payload);

      const recipientCount = res?.recipients ?? 0;
      const pushSent = res?.push?.sent ?? 0;
      const pushSkipped = res?.push?.skipped ?? 0;
      showToast(
        `Notification saved for ${recipientCount} user${
          recipientCount === 1 ? "" : "s"
        }. Push sent: ${pushSent}, skipped: ${pushSkipped}.`
      );

      // Reset main inputs
      setTitle("");
      setMessage("");
      setSendMode("NOW");
      setScheduledAt("");
      setRepeatMode("NONE");
    } catch (err: unknown) {
      console.error("Failed to send notification:", err);
      showToast(getErrorMessage(err, "Failed to send notification"));
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-semibold leading-8 text-slate-900">
              Send Notifications
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Broadcast announcements to all app users, specific city areas or individual accounts.
            </p>
          </div>
          <Link
            href="/notifications"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            📋 View Notification History
          </Link>
        </div>

        <form
          className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={handleSendNotification}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
            {/* Title */}
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-900">
                Notification title <span className="text-red-500">*</span>
              </span>
              <input
                required
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400"
                placeholder="e.g. Weekend Deals are live! 🍕"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            {/* Target Audience */}
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-900">Audience</span>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400 cursor-pointer"
                value={targetType}
                onChange={(event) =>
                  setTargetType(event.target.value as "ALL" | "AREA" | "USER")
                }
              >
                <option value="ALL">All App Users</option>
                <option value="AREA">Specific Area</option>
                <option value="USER">Specific User</option>
              </select>
            </label>

            {/* Trigger Mode */}
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-900">Trigger</span>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400 cursor-pointer"
                value={sendMode}
                onChange={(event) => setSendMode(event.target.value as "NOW" | "SCHEDULED")}
              >
                <option value="NOW">Send now</option>
                <option value="SCHEDULED">Schedule for later</option>
              </select>
            </label>
          </div>

          {/* Conditional Target Selectors */}
          {targetType === "AREA" && (
            <div className="mt-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-900">
                  Target Area <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400 cursor-pointer"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.city})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {targetType === "USER" && (
            <div className="mt-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-900">
                  Select User <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400 cursor-pointer"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || "User"} ({u.email || u.phoneNumber || u.id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Conditional Schedule Fields */}
          {sendMode === "SCHEDULED" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-900">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </span>
                <input
                  type="datetime-local"
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-900">Repeat</span>
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-orange-400 cursor-pointer"
                  value={repeatMode}
                  onChange={(e) =>
                    setRepeatMode(e.target.value as "NONE" | "DAILY" | "WEEKLY")
                  }
                >
                  <option value="NONE">Do not repeat</option>
                  <option value="DAILY">Repeat daily</option>
                  <option value="WEEKLY">Repeat weekly</option>
                </select>
              </label>
            </div>
          )}

          {/* Message Body */}
          <label className="mt-4 grid gap-1">
            <span className="text-sm font-medium text-slate-900">
              Message <span className="text-red-500">*</span>
            </span>
            <textarea
              required
              className="min-h-24 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400"
              placeholder="Write the message that users will receive on their mobile devices..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <button
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
            type="submit"
            disabled={sending}
          >
            {sending ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              "🚀 Send Notification"
            )}
          </button>
        </form>

        {/* Birthday Perks Section */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Birthday Perks</h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure birthday offer notifications and automatic birthday triggers.
              </p>
            </div>
            <button
              className={
                birthdayPerksEnabled
                  ? "h-10 rounded-xl bg-[#f97316] px-4 text-sm font-medium text-white cursor-pointer"
                  : "h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 cursor-pointer"
              }
              type="button"
              onClick={() => setBirthdayPerksEnabled((current) => !current)}
            >
              {birthdayPerksEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-900">Perk category</span>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none focus:border-orange-400 cursor-pointer"
                value={birthdayCategory}
                onChange={(event) => setBirthdayCategory(event.target.value)}
              >
                {birthdayOfferCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-slate-900">Send time</span>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none focus:border-orange-400 cursor-pointer"
                value={birthdayLeadTime}
                onChange={(event) => setBirthdayLeadTime(event.target.value)}
              >
                <option value="On birthday">On birthday</option>
                <option value="1 day before">1 day before</option>
                <option value="7 days before">7 days before</option>
              </select>
            </label>

            <button
              className="mt-6 h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 hover:bg-slate-100 md:mt-auto cursor-pointer"
              type="button"
              onClick={() =>
                showToast(`Birthday perks saved: ${birthdayCategory}, ${birthdayLeadTime}`)
              }
            >
              Save Birthday Perks
            </button>
          </div>
        </div>
      </section>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
