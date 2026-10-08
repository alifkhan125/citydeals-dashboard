import { apiClient } from "./client";

export type TicketStatus = "Open" | "Pending" | "Closed";

interface ApiSupportTicket {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  message: string;
  response?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
}

export interface SupportTicket {
  id: string;
  rawId: string;
  user: string;
  email: string;
  message: string;
  status: TicketStatus;
  created: string;
  createdAt: string;
  response?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function mapTicket(item: ApiSupportTicket): SupportTicket {
  const rawStatus = (item.status || "OPEN").toUpperCase();
  let status: TicketStatus = "Open";
  if (rawStatus === "CLOSED") status = "Closed";
  else if (rawStatus === "PENDING") status = "Pending";

  return {
    id: `#${item.id.slice(0, 6).toUpperCase()}`,
    rawId: item.id,
    user: item.fullName || item.user?.fullName || "Guest User",
    email: item.email || item.user?.email || "No email",
    message: item.message || "",
    status,
    created: formatRelativeTime(item.createdAt),
    createdAt: item.createdAt,
    response: item.response || undefined,
  };
}

export const supportApi = {
  listTickets: async (): Promise<SupportTicket[]> => {
    const res = await apiClient.get<unknown, ApiSupportTicket[] | { data?: ApiSupportTicket[] }>(
      "/support/tickets",
    );
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(mapTicket);
  },
  updateStatus: ({ rawId, status }: { rawId: string; status: TicketStatus }) =>
    apiClient.patch(`/support/tickets/${rawId}/status`, { status: status.toUpperCase() }),
  reply: ({ rawId, response }: { rawId: string; response: string }) =>
    apiClient.patch(`/support/tickets/${rawId}/reply`, { response }),
};
