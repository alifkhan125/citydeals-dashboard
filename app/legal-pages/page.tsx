"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { type LegalPage, type LegalPageStatus } from "@/api/legal";
import { toast } from "@/components/Toast";
import { useLegalPages, useSaveLegalPage } from "@/hooks/useLegalPages";

export default function LegalPagesPage() {
  const {
    data: pages = [],
    isLoading,
    isError,
  } = useLegalPages();

  const [selectedId, setSelectedId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState<LegalPageStatus>("Published");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [editorHtml, setEditorHtml] = useState<string>("");
  const [currentFontSize, setCurrentFontSize] = useState<string>("15px");

  const editorRef = useRef<HTMLDivElement>(null);
  const saveMutation = useSaveLegalPage();

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
    const initialContent = page.content || "<p>Type content here...</p>";
    setEditorHtml(initialContent);

    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }

  // Update editor innerHTML when switching selected page
  useEffect(() => {
    if (editorRef.current && selectedPage) {
      editorRef.current.innerHTML = selectedPage.content || "<p>Type content here...</p>";
      setEditorHtml(selectedPage.content || "<p>Type content here...</p>");
    }
  }, [selectedId]);

  // Sync state on input in contentEditable
  function handleEditorInput() {
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
    }
    updateActiveFormatting();
  }

  // Detect and update font size at current cursor position (Google Docs behavior)
  function updateActiveFormatting() {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const node = selection.anchorNode;
    if (!node) return;

    let element: HTMLElement | null =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement;

    while (element && element !== editorRef.current) {
      if (element.style && element.style.fontSize) {
        setCurrentFontSize(element.style.fontSize);
        return;
      }
      const computed = window.getComputedStyle(element);
      if (computed && computed.fontSize) {
        const roundedPx = `${Math.round(parseFloat(computed.fontSize))}px`;
        setCurrentFontSize(roundedPx);
        return;
      }
      element = element.parentElement;
    }

    setCurrentFontSize("15px");
  }

  // Handle switching to preview or edit
  function handleSwitchViewMode(mode: "edit" | "preview") {
    if (mode === "preview") {
      if (editorRef.current) {
        setEditorHtml(editorRef.current.innerHTML);
      }
    }
    setViewMode(mode);
  }

  // When returning to edit view, ensure DOM has current editorHtml
  useEffect(() => {
    if (viewMode === "edit" && editorRef.current) {
      if (editorRef.current.innerHTML !== editorHtml) {
        editorRef.current.innerHTML = editorHtml;
      }
    }
  }, [viewMode, editorHtml]);

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

  // Google Docs-style Rich Text Commands via execCommand
  function executeCmd(command: string, value: string | undefined = undefined) {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }

  function formatHeading(tag: "h1" | "h2" | "h3" | "p") {
    if (typeof document !== "undefined") {
      document.execCommand("formatBlock", false, `<${tag}>`);
      if (editorRef.current) {
        editorRef.current.focus();
        setEditorHtml(editorRef.current.innerHTML);
      }
    }
  }

  // Google Docs style precise Font Size function
  function formatFontSize(sizeInPx: string) {
    if (typeof document === "undefined") return;

    setCurrentFontSize(sizeInPx);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // If text is selected, wrap in a span with inline fontSize
    if (!range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = sizeInPx;
      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
      } catch {
        // Fallback to execCommand fontSize if complex range
        document.execCommand("fontSize", false, "4");
      }
    } else {
      // If cursor only, insert a styled zero-width space span for ongoing typing
      const span = document.createElement("span");
      span.style.fontSize = sizeInPx;
      span.innerHTML = "&#8203;";
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStart(span, 1);
      newRange.setEnd(span, 1);
      selection.addRange(newRange);
    }

    if (editorRef.current) {
      editorRef.current.focus();
      setEditorHtml(editorRef.current.innerHTML);
    }
  }

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
    }
    return fallback;
  }

  function handleSave() {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug cannot be empty");
      return;
    }

    const htmlContent = editorRef.current?.innerHTML || editorHtml || "";
    const pageType = selectedPage?.type || slug;

    saveMutation.mutate(
      {
        pageType,
        payload: {
          title: title.trim(),
          content: htmlContent,
          version: version.trim() || "1.0",
        },
      },
      {
        onSuccess: () => toast.success(`${title} saved successfully`, { title: "Changes Saved" }),
        onError: (error) => toast.error(getErrorMessage(error, "Failed to save legal page"), { title: "Save Failed" }),
      },
    );
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
        {/* Top Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">
              Legal Pages
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Visual Google Docs-style rich text document editor for Terms, Privacy and Policies.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
            <button
              className="h-11 w-full rounded-xl bg-[#f97316] px-6 text-sm font-semibold whitespace-nowrap text-white shadow-xs hover:bg-[#ea580c] sm:w-auto disabled:opacity-50 transition cursor-pointer"
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending ? "Saving Document..." : "Save Content"}
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
          <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
            {/* Sidebar Documents List */}
            <div className="overflow-hidden rounded-xl border border-slate-200 h-fit bg-slate-50/50">
              <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Documents
              </div>
              {pages.map((page) => {
                const active = page.id === selectedId;

                return (
                  <button
                    className={
                      active
                        ? "grid w-full grid-cols-[1fr_75px] border-b border-slate-100 bg-orange-50/80 px-4 py-3 text-left text-sm last:border-b-0 border-l-4 border-l-orange-500"
                        : "grid w-full grid-cols-[1fr_75px] border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 last:border-b-0"
                    }
                    key={page.id}
                    type="button"
                    onClick={() => loadPage(page)}
                  >
                    <span className="min-w-0 pr-2">
                      <strong className="block truncate text-slate-900 font-medium">
                        {page.title}
                      </strong>
                      <small className="block truncate text-slate-500">
                        {page.slug} · v{page.version}
                      </small>
                    </span>
                    <span
                      className={
                        page.status === "Published"
                          ? "mt-1 h-fit rounded-full bg-emerald-100 px-2 py-0.5 text-center text-[11px] font-semibold text-emerald-700"
                          : "mt-1 h-fit rounded-full bg-slate-200 px-2 py-0.5 text-center text-[11px] font-semibold text-slate-600"
                      }
                    >
                      {page.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Document Editor Area */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-100/60 p-4 shadow-inner">
              {/* Metadata Inputs */}
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs md:grid-cols-4 mb-4">
                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-slate-700">Document Title</span>
                  <input
                    className="h-9 min-w-0 rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                  />
                </label>

                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-slate-700">Slug / Type</span>
                  <input
                    className="h-9 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-500 outline-none"
                    value={slug}
                    disabled
                  />
                </label>

                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-slate-700">Version</span>
                  <input
                    className="h-9 min-w-0 rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  />
                </label>

                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-slate-700">Status</span>
                  <select
                    className="h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
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

              {/* Google Docs Style Toolbar */}
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 rounded-t-xl border border-b-0 border-slate-200 bg-white px-3 py-2 shadow-2xs">
                {/* Text / Heading Style dropdown */}
                <select
                  onChange={(e) => formatHeading(e.target.value as any)}
                  className="h-8 rounded border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 cursor-pointer"
                  defaultValue="p"
                >
                  <option value="p">Normal Text</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                {/* Font Size dropdown (Google Docs style) */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-slate-400 pl-1">Size:</span>
                  <select
                    value={currentFontSize}
                    onChange={(e) => formatFontSize(e.target.value)}
                    className="h-8 rounded border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 cursor-pointer"
                  >
                    <option value="12px">12px (Small)</option>
                    <option value="14px">14px</option>
                    <option value="15px">15px (Default)</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px (Medium)</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px (Large)</option>
                    <option value="28px">28px (Title)</option>
                    <option value="32px">32px (Huge)</option>
                  </select>
                </div>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Bold */}
                <button
                  type="button"
                  title="Bold (Ctrl+B)"
                  onClick={() => executeCmd("bold")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-800 font-bold transition cursor-pointer"
                >
                  B
                </button>

                {/* Italic */}
                <button
                  type="button"
                  title="Italic (Ctrl+I)"
                  onClick={() => executeCmd("italic")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-800 italic font-serif text-base transition cursor-pointer"
                >
                  I
                </button>

                {/* Underline */}
                <button
                  type="button"
                  title="Underline (Ctrl+U)"
                  onClick={() => executeCmd("underline")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-800 underline font-semibold transition cursor-pointer"
                >
                  U
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  title="Strikethrough"
                  onClick={() => executeCmd("strikeThrough")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-800 line-through text-xs font-medium transition cursor-pointer"
                >
                  S
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Alignment */}
                <button
                  type="button"
                  title="Align Left"
                  onClick={() => executeCmd("justifyLeft")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" />
                  </svg>
                </button>

                <button
                  type="button"
                  title="Align Center"
                  onClick={() => executeCmd("justifyCenter")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M4 18h16" />
                  </svg>
                </button>

                <button
                  type="button"
                  title="Align Right"
                  onClick={() => executeCmd("justifyRight")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16" />
                  </svg>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Bullet List */}
                <button
                  type="button"
                  title="Bulleted list"
                  onClick={() => executeCmd("insertUnorderedList")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h.01M9 6h11M4 12h.01M9 12h11M4 18h.01M9 18h11" />
                  </svg>
                </button>

                {/* Numbered List */}
                <button
                  type="button"
                  title="Numbered list"
                  onClick={() => executeCmd("insertOrderedList")}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h1M4 10h2M4 14h2M9 6h11M9 12h11M9 18h11" />
                  </svg>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Remove Formatting */}
                <button
                  type="button"
                  title="Clear formatting"
                  onClick={() => executeCmd("removeFormat")}
                  className="flex h-8 px-2 items-center justify-center rounded hover:bg-slate-100 text-xs text-slate-600 transition cursor-pointer"
                >
                  Clear
                </button>

                {/* Toggle View Mode */}
                <div className="ml-auto flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSwitchViewMode("edit")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      viewMode === "edit"
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Edit Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchViewMode("preview")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                      viewMode === "preview"
                        ? "bg-white text-orange-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Web Preview
                  </button>
                </div>
              </div>

              {/* Google Docs Canvas: Centered white page with paper shadow */}
              <div className="flex justify-center p-6 bg-slate-200/60 rounded-b-xl border border-t-0 border-slate-200">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onBlur={handleEditorInput}
                  onKeyUp={updateActiveFormatting}
                  onClick={updateActiveFormatting}
                  onSelect={updateActiveFormatting}
                  className={`rich-text-content w-full max-w-[800px] min-h-[600px] h-auto bg-white rounded-lg shadow-md border border-slate-200/80 p-10 md:p-14 outline-none text-slate-800 text-[15px] leading-relaxed font-sans focus:ring-2 focus:ring-orange-500/20 whitespace-pre-wrap ${
                    viewMode === "edit" ? "block" : "hidden"
                  }`}
                />
                <div
                  className={`rich-text-content w-full max-w-[800px] min-h-[600px] h-auto bg-white rounded-lg shadow-md border border-slate-200/80 p-10 md:p-14 text-slate-800 text-[15px] leading-relaxed font-sans whitespace-pre-wrap ${
                    viewMode === "preview" ? "block" : "hidden"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: editorHtml,
                  }}
                />
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  type="button"
                  onClick={handleTogglePublish}
                >
                  {status === "Published" ? "Move to Draft" : "Publish to Live"}
                </button>
                <span className="text-xs text-slate-500">
                  Changes will be saved directly to the database upon clicking <strong>Save Content</strong>.
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
