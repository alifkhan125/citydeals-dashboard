"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { toast } from "@/components/Toast";

type LegalPageStatus = "Published" | "Draft";

interface ApiLegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  version: string;
  updatedAt: string;
}

interface LegalPage {
  id: string;
  type: string;
  title: string;
  slug: string;
  version: string;
  status: LegalPageStatus;
  content: string;
  updatedAt: string;
}

function typeToSlug(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}

export default function LegalPagesPage() {
  const queryClient = useQueryClient();

  const {
    data: apiPages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["legal-pages"],
    queryFn: async () => {
      const data = await apiClient.get<unknown, ApiLegalDocument[]>("/legal/pages");
      return Array.isArray(data) ? data : [];
    },
  });

  const pages: LegalPage[] = useMemo(() => {
    if (!apiPages.length) return [];
    return apiPages.map((doc) => ({
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
    }));
  }, [apiPages]);

  const [selectedId, setSelectedId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState<LegalPageStatus>("Published");
  const [content, setContent] = useState("");

  // Select initial page when data loads
  useEffect(() => {
    if (pages.length > 0) {
      if (!selectedId || !pages.some((p) => p.id === selectedId)) {
        loadPage(pages[0]);
      }
    }
  }, [pages, selectedId]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedId) ?? pages[0],
    [pages, selectedId]
  );

  function loadPage(page: LegalPage) {
    setSelectedId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setVersion(page.version);
    setStatus(page.status);
    setContent(page.content);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!selectedPage || selectedPage.title === title) {
      setSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  // Mutation to save legal page to backend
  const saveMutation = useMutation({
    mutationFn: async ({
      pageType,
      payload,
    }: {
      pageType: string;
      payload: { title: string; content: string; version: string };
    }) => {
      return apiClient.put(`/legal/pages/${pageType}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-pages"] });
      toast.success(`${title} saved successfully`, { title: "Changes Saved" });
    },
    onError: (err: unknown) => {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save legal page";
      toast.error(errMsg, { title: "Save Failed" });
    },
  });

  function handleSave() {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug cannot be empty");
      return;
    }

    const pageType = selectedPage?.type || slug;
    saveMutation.mutate({
      pageType,
      payload: {
        title: title.trim(),
        content,
        version: version.trim() || "1.0",
      },
    });
  }

  function handleTogglePublish() {
    const nextStatus: LegalPageStatus =
      status === "Published" ? "Draft" : "Published";
    setStatus(nextStatus);
    toast.info(`${title} status updated to ${nextStatus}`);
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">
              Legal Pages
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Manage mobile app Terms of Use, Privacy Policy and coupon rules
              dynamically.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
            <button
              className="h-11 w-full rounded-xl bg-[#f97316] px-5 text-sm font-medium whitespace-nowrap text-white hover:opacity-95 sm:w-auto disabled:opacity-50"
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending ? "Saving..." : "Save Content"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Loading legal pages...
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-sm text-red-500">
            Failed to load legal pages from server.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              {pages.map((page) => {
                const active = page.id === selectedId;

                return (
                  <button
                    className={
                      active
                        ? "grid w-full grid-cols-[1fr_84px] border-b border-slate-100 bg-orange-50 px-4 py-3 text-left text-sm last:border-b-0"
                        : "grid w-full grid-cols-[1fr_84px] border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 last:border-b-0"
                    }
                    key={page.id}
                    type="button"
                    onClick={() => loadPage(page)}
                  >
                    <span className="min-w-0 pr-2">
                      <strong className="block truncate text-slate-900">
                        {page.title}
                      </strong>
                      <small className="block truncate text-slate-500">
                        {page.slug} · v{page.version}
                      </small>
                      <small className="block text-slate-400">
                        {page.updatedAt}
                      </small>
                    </span>
                    <span
                      className={
                        page.status === "Published"
                          ? "mt-1 h-fit rounded-full bg-emerald-100 px-2 py-1 text-center text-xs font-medium text-emerald-700"
                          : "mt-1 h-fit rounded-full bg-slate-100 px-2 py-1 text-center text-xs font-medium text-slate-600"
                      }
                    >
                      {page.status}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-900">Title</span>
                  <input
                    className="h-10 min-w-0 rounded-lg border border-slate-200 px-3 outline-none focus:border-orange-400"
                    value={title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-900">Slug</span>
                  <input
                    className="h-10 min-w-0 rounded-lg border border-slate-200 px-3 outline-none focus:border-orange-400"
                    value={slug}
                    disabled
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-900">Version</span>
                  <input
                    className="h-10 min-w-0 rounded-lg border border-slate-200 px-3 outline-none focus:border-orange-400"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-slate-900">Status</span>
                  <select
                    className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-orange-400"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as LegalPageStatus)
                    }
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
              </div>

              <label className="mt-3 grid gap-1 text-sm">
                <span className="font-medium text-slate-900">Content</span>
                <textarea
                  className="min-h-56 resize-y rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-orange-400 sm:min-h-72"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </label>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  type="button"
                  onClick={handleTogglePublish}
                >
                  {status === "Published" ? "Move to Draft" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
