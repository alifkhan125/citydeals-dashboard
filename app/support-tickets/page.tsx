"use client";

import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { type SupportTicket, type TicketStatus } from "@/api/support";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import {
  useReplySupportTicket,
  useSupportTickets,
  useUpdateSupportTicketStatus,
} from "@/hooks/useSupportTickets";

const ticketStatuses: TicketStatus[] = ["Open", "Pending", "Closed"];

export default function SupportTicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch real support tickets from backend API
  const {
    data: tickets = [],
    isLoading,
    isError,
    refetch,
  } = useSupportTickets();

  // Mutation to update ticket status
  const updateStatusMutation = useUpdateSupportTicketStatus();

  // Mutation to reply to ticket
  const replyMutation = useReplySupportTicket();

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  }

  function openReply(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    setReplyMessage(ticket.response ?? "");
  }

  function closeReply() {
    setSelectedTicket(null);
    setReplyMessage("");
  }

  function handleSendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    replyMutation.mutate(
      {
        rawId: selectedTicket.rawId,
        response: replyMessage.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Reply submitted successfully", { title: "Ticket Updated" });
          closeReply();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to send reply")),
      },
    );
  }

  function handleStatusChange(rawId: string, status: TicketStatus) {
    setOpenStatusMenuId(null);
    updateStatusMutation.mutate(
      { rawId, status },
      {
        onSuccess: () => toast.success(`Ticket status updated to ${status}`),
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update ticket status")),
      },
    );
  }

  function getStatusClass(status: TicketStatus) {
    if (status === "Open") return "bg-orange-50 text-[#f97316] border border-orange-200";
    if (status === "Pending") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }

  // Filtered tickets based on tab and search
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesFilter =
        activeFilter === "All" || t.status.toLowerCase() === activeFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [tickets, activeFilter, searchQuery]);

  function renderStatusMenu(ticket: SupportTicket, isUpwards: boolean = false) {
    const isOpen = openStatusMenuId === ticket.rawId;

    return (
      <div className="relative min-w-0">
        <button
          aria-expanded={isOpen}
          className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-medium text-slate-700 outline-none transition-colors hover:border-[#f97316] hover:bg-orange-50/50 focus:border-[#f97316] focus:ring-2 focus:ring-orange-100 lg:h-9"
          type="button"
          onClick={() =>
            setOpenStatusMenuId((currentId) => (currentId === ticket.rawId ? null : ticket.rawId))
          }
          disabled={updateStatusMutation.isPending}
        >
          <span>{ticket.status}</span>
          <span className="text-[#f97316]">▾</span>
        </button>

        {isOpen && (
          <>
            {/* Click-outside backdrop to dismiss */}
            <div
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setOpenStatusMenuId(null)}
            />

            <div
              className={`absolute right-0 z-30 w-36 overflow-hidden rounded-xl border border-orange-200 bg-white py-1 text-xs shadow-2xl ${
                isUpwards ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
              }`}
            >
              {ticketStatuses.map((status) => {
                const isSelected = status === ticket.status;

                return (
                  <button
                    className={
                      isSelected
                        ? "block w-full bg-[#f97316] px-3.5 py-2 text-left font-semibold text-white"
                        : "block w-full px-3.5 py-2 text-left font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    }
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(ticket.rawId, status)}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        {/* Header & Stats */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Help & Support Tickets
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Manage incoming support inquiries from the mobile app, respond directly, and track
              ticket statuses.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 text-sm sm:w-auto">
            {ticketStatuses.map((status) => {
              const count = tickets.filter((t) => t.status === status).length;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveFilter(status)}
                  className={`rounded-xl border px-3.5 py-2 text-left transition-all ${
                    activeFilter === status
                      ? "border-orange-500 bg-orange-50/70 ring-1 ring-orange-400"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span className="block text-xs font-medium text-slate-500">{status}</span>
                  <strong className="text-base font-bold text-slate-900">{count}</strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["All", "Open", "Pending", "Closed"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === tab
                    ? "bg-[#f97316] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
                {tab === "All" && ` (${tickets.length})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, email, message..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-2.5 size-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading support tickets...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="my-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-600">Failed to load support tickets</p>
            <p className="mt-1 text-xs text-red-500">
              Please check your connection or make sure the backend server is running.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-600 mb-3">
              <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No support tickets found</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {searchQuery
                ? "No tickets match your search query. Try clearing the search filter."
                : "When users submit inquiries through the mobile app, tickets will show up here."}
            </p>
          </div>
        )}

        {/* Mobile / Tablet Card View */}
        {!isLoading && !isError && filteredTickets.length > 0 && (
          <div className="mt-5 grid gap-3 lg:hidden">
            {filteredTickets.map((ticket, index) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                key={ticket.rawId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{ticket.id}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold leading-5 text-slate-900">
                      {ticket.user}
                    </h2>
                    <p className="truncate text-xs text-slate-500">{ticket.email}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">{ticket.created}</span>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                  {ticket.response && (
                    <div className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-orange-950 bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                      <strong className="block text-orange-700 text-[11px] uppercase font-bold tracking-wider mb-0.5">
                        Admin Reply:
                      </strong>
                      {ticket.response}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 grid grid-cols-[1fr_auto] gap-2">
                  {renderStatusMenu(
                    ticket,
                    index === filteredTickets.length - 1 && filteredTickets.length > 1
                  )}
                  <button
                    className="h-10 rounded-lg bg-[#f97316] px-4 text-xs font-semibold text-white shadow-xs hover:bg-orange-600 active:scale-98 transition-all"
                    type="button"
                    onClick={() => openReply(ticket)}
                  >
                    Reply
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Desktop Table View */}
        {!isLoading && !isError && filteredTickets.length > 0 && (
          <div className="mt-5 hidden overflow-x-auto rounded-xl border border-slate-200 lg:block min-h-[280px] pb-24">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[110px_1fr_1.8fr_110px_130px_200px] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {["Ticket", "User", "Message", "Status", "Created", "Actions"].map((heading) => (
                  <div className="border-r border-slate-200 px-4 py-3.5 last:border-r-0" key={heading}>
                    {heading}
                  </div>
                ))}
              </div>

              {filteredTickets.map((ticket, index) => (
                <div
                  className="grid grid-cols-[110px_1fr_1.8fr_110px_130px_200px] items-center border-t border-slate-200 text-sm hover:bg-slate-50/50 transition-colors"
                  key={ticket.rawId}
                >
                  <div className="px-4 py-3 font-mono font-semibold text-slate-900">{ticket.id}</div>
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-sm font-semibold text-slate-900">
                      {ticket.user}
                    </strong>
                    <small className="block truncate text-xs text-slate-500">{ticket.email}</small>
                  </div>
                  <div className="min-w-0 px-4 py-3">
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-800">
                      {ticket.message}
                    </p>
                    {ticket.response && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-orange-600 font-medium">
                        ↳ Replied: {ticket.response}
                      </p>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="px-4 py-3 text-xs text-slate-500">{ticket.created}</div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      className="rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-600 transition-colors"
                      type="button"
                      onClick={() => openReply(ticket)}
                    >
                      Reply
                    </button>
                    <div className="w-28">
                      {renderStatusMenu(
                        ticket,
                        index >= filteredTickets.length - 1 && filteredTickets.length > 2
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Reply Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={closeReply}
        title={selectedTicket ? `Reply to ${selectedTicket.user}` : "Reply to Ticket"}
        subtitle={selectedTicket ? `${selectedTicket.id} · ${selectedTicket.email}` : undefined}
        maxWidth="max-w-[580px]"
      >
        {selectedTicket && (
          <form className="flex flex-col gap-4" onSubmit={handleSendReply}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                User Inquiry
              </span>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedTicket.message}
              </p>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Official Response / Notes
              </span>
              <textarea
                className="min-h-32 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 leading-relaxed"
                placeholder="Write your response to the user or internal resolution notes..."
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                disabled={replyMutation.isPending}
                required
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                className="h-10 sm:h-11 flex-1 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                type="button"
                onClick={closeReply}
                disabled={replyMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="h-10 sm:h-11 flex-1 rounded-xl bg-[#f97316] text-xs sm:text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 shadow-xs transition-colors flex items-center justify-center gap-2"
                type="submit"
                disabled={replyMutation.isPending || !replyMessage.trim()}
              >
                {replyMutation.isPending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Send Reply</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
