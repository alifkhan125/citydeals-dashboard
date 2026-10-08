import { apiClient } from "./client";

export type LegalPageStatus = "Published" | "Draft";

export interface ApiLegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  updatedAt: string;
}

export interface LegalPage {
  id: string;
  type: string;
  title: string;
  slug: string;
  version: string;
  status: LegalPageStatus;
  content: string;
  updatedAt: string;
}

export interface SaveLegalPayload {
  title: string;
  content: string;
  version: string;
}

function typeToSlug(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}

function mapLegalPage(doc: ApiLegalDocument): LegalPage {
  return {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    slug: typeToSlug(doc.type),
    version: doc.version || "1.0",
    status: "Published",
    content: doc.content || "",
    updatedAt: new Date(doc.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export const legalApi = {
  listPages: async (): Promise<LegalPage[]> => {
    const data = await apiClient.get<unknown, ApiLegalDocument[]>("/legal/pages");
    return Array.isArray(data) ? data.map(mapLegalPage) : [];
  },
  savePage: ({ pageType, payload }: { pageType: string; payload: SaveLegalPayload }) =>
    apiClient.put(`/legal/pages/${pageType}`, payload),
};
