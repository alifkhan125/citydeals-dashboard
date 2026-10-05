"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import Modal from "@/components/Modal";
import { apiClient } from "@/api/client";
import { uploadImage } from "@/api/upload";

const assetBase = "/assets/dashboard/";

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  sortOrder?: number;
}

export default function CategoriesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [openActionSlug, setOpenActionSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  async function fetchCategories() {
    try {
      setLoading(true);
      const data = await apiClient.get("/categories");
      if (Array.isArray(data)) {
        setCategoryList(data as Category[]);
      }
    } catch (err: unknown) {
      console.error("Failed to load categories:", err);
      showToast("Failed to load categories from server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (iconPreview && iconPreview.startsWith("blob:")) {
        URL.revokeObjectURL(iconPreview);
      }
    };
  }, [iconPreview]);

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIconFile(file);
    const nextPreview = URL.createObjectURL(file);
    setIconPreview(nextPreview);
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }

  function handleOpenNewCategory() {
    setOpenActionSlug(null);
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setStatus("ACTIVE");
    setIconFile(null);
    setIconPreview(null);
    setIsDrawerOpen(true);
  }

  function handleEditCategory(category: Category) {
    setOpenActionSlug(null);
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setStatus(category.status);
    setIconFile(null);
    setIconPreview(category.iconUrl || null);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditingCategory(null);
    setIconFile(null);
    setIconPreview(null);
  }

  async function handleToggleStatus(category: Category) {
    setOpenActionSlug(null);
    const newStatus = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiClient.patch(`/categories/${category.id}`, { status: newStatus });
      showToast(`${category.name} ${newStatus === "ACTIVE" ? "published" : "unpublished"}`);
      await fetchCategories();
    } catch (err: unknown) {
      console.error("Failed to toggle status:", err);
      showToast("Failed to update category status");
    }
  }

  async function handleDeleteCategory(category: Category) {
    setOpenActionSlug(null);
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) return;
    try {
      await apiClient.delete(`/categories/${category.id}`);
      showToast(`Deleted ${category.name}`);
      await fetchCategories();
    } catch (err: unknown) {
      console.error("Failed to delete category:", err);
      showToast("Failed to delete category");
    }
  }

  async function handleSaveCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      showToast("Category name is required");
      return;
    }

    try {
      setSaving(true);
      let uploadedIconUrl = editingCategory?.iconUrl || "";

      if (iconFile) {
        try {
          const uploadRes = await uploadImage(iconFile, "categories");
          uploadedIconUrl = uploadRes.secureUrl || uploadRes.url;
        } catch (uploadErr) {
          console.warn("Icon upload failed, continuing:", uploadErr);
        }
      }

      const generatedSlug =
        slug.trim() ||
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const payload = {
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined,
        status,
        iconUrl: uploadedIconUrl || undefined,
      };

      if (editingCategory) {
        await apiClient.patch(`/categories/${editingCategory.id}`, payload);
        showToast("Category changes saved");
      } else {
        await apiClient.post("/categories", payload);
        showToast("Category created successfully");
      }

      handleCloseDrawer();
      await fetchCategories();
    } catch (err: unknown) {
      console.error("Failed to save category:", err);
      showToast(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <style jsx>{`
        .categories-mobile-list {
          display: grid;
        }

        .categories-desktop-table {
          display: none;
        }

        @media (min-width: 1024px) {
          .categories-mobile-list {
            display: none;
          }

          .categories-desktop-table {
            display: block;
          }
        }
      `}</style>
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-normal leading-8 text-slate-900 sm:text-base sm:leading-6">
              Coupon categories
            </h1>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#475569] sm:truncate">
              Categories drive how shoppers filter offers. Keep the list short, clear and consistent across every city.
            </p>
          </div>
          <button
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-3 py-3 text-base leading-6 text-white sm:w-auto"
            type="button"
            onClick={handleOpenNewCategory}
          >
            <Image src={`${assetBase}imgAdd.svg`} alt="" width={24} height={24} />
            Add New category
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            Loading categories from server...
          </div>
        ) : categoryList.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-sm">No categories found.</p>
            <button
              onClick={handleOpenNewCategory}
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              + Add your first category
            </button>
          </div>
        ) : (
          <>
            <div className="categories-mobile-list mt-4 gap-3">
              {categoryList.map((category) => (
                <article
                  className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  key={category.id || category.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded bg-slate-100">
                        <Image
                          className="object-cover"
                          src={category.iconUrl || `${assetBase}imgLocationAvatar.png`}
                          alt={category.name}
                          fill
                          sizes="40px"
                          unoptimized={!!category.iconUrl}
                        />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-medium leading-5 text-slate-900">
                          {category.name}
                        </strong>
                        <small className="block truncate text-xs leading-4 text-[#475569]">
                          {category.slug}
                        </small>
                      </span>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        aria-expanded={openActionSlug === category.slug}
                        aria-label={`Open actions for ${category.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        type="button"
                        onClick={() =>
                          setOpenActionSlug((currentSlug) =>
                            currentSlug === category.slug ? null : category.slug
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionSlug === category.slug && (
                        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCategory(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(category)}
                          >
                            {category.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-5 text-slate-700">{category.description || "—"}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </span>
                    <span
                      className={
                        category.status === "ACTIVE"
                          ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2 text-sm leading-5 text-[#16a34a]"
                          : "inline-flex h-6 items-center rounded bg-slate-100 px-2 text-sm leading-5 text-slate-600"
                      }
                    >
                      {category.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="categories-desktop-table mt-4 overflow-x-auto overflow-y-visible rounded-lg border border-slate-200">
              <div className="min-w-[760px]">
                <div className="grid h-[55px] grid-cols-[minmax(220px,1.1fr)_minmax(260px,1.8fr)_110px_90px] items-center bg-slate-100 text-sm leading-5 text-[#315576]">
                  {["Name", "Description", "Status", "Actions"].map((heading) => (
                    <div className="border-r border-slate-300 px-3 last:border-r-0" key={heading}>
                      {heading}
                    </div>
                  ))}
                </div>

                {categoryList.map((category) => (
                  <div
                    className="grid h-[52px] grid-cols-[minmax(220px,1.1fr)_minmax(260px,1.8fr)_110px_90px] items-center border-b border-dashed border-slate-200 bg-white last:border-b-0"
                    key={category.id || category.slug}
                  >
                    <div className="flex min-w-0 items-center gap-3 px-3 py-2">
                      <span className="relative size-8 shrink-0 overflow-hidden rounded bg-slate-100">
                        <Image
                          className="object-cover"
                          src={category.iconUrl || `${assetBase}imgLocationAvatar.png`}
                          alt={category.name}
                          fill
                          sizes="32px"
                          unoptimized={!!category.iconUrl}
                        />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-normal leading-5 text-slate-900">
                          {category.name}
                        </strong>
                        <small className="block truncate text-xs leading-4 text-[#475569]">
                          {category.slug}
                        </small>
                      </span>
                    </div>
                    <p className="truncate px-3 text-sm leading-5 text-slate-900">
                      {category.description || "—"}
                    </p>
                    <div className="px-3">
                      <span
                        className={
                          category.status === "ACTIVE"
                            ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2 text-sm leading-5 text-[#16a34a]"
                            : "inline-flex h-6 items-center rounded bg-slate-100 px-2 text-sm leading-5 text-slate-600"
                        }
                      >
                        {category.status === "ACTIVE" ? "Active" : "Draft"}
                      </span>
                    </div>
                    <div className="relative flex justify-center px-3">
                      <button
                        aria-expanded={openActionSlug === category.slug}
                        aria-label={`Open actions for ${category.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        type="button"
                        onClick={() =>
                          setOpenActionSlug((currentSlug) =>
                            currentSlug === category.slug ? null : category.slug
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionSlug === category.slug && (
                        <div className="absolute right-3 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCategory(category)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(category)}
                          >
                            {category.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        subtitle={editingCategory ? `Update ${editingCategory.name}` : "Enter category details"}
        maxWidth="max-w-[620px]"
      >
        <form className="flex flex-col gap-3" onSubmit={handleSaveCategory}>
          <div className="flex w-full items-center gap-6 rounded-3xl border border-[#e5e7eb] bg-gray-100 p-3.5">
            <span className="relative grid size-[76px] place-items-center overflow-hidden rounded-2xl border-2 border-[#d1d5db] bg-white">
              {iconPreview ? (
                <Image
                  className="object-cover"
                  src={iconPreview}
                  alt=""
                  fill
                  sizes="76px"
                  unoptimized
                />
              ) : (
                <Image src={`${assetBase}imgTag2.svg`} alt="" width={36} height={36} />
              )}
            </span>
            <label
              className="flex h-12 cursor-pointer items-center rounded-lg border border-[#e5e7eb] bg-gray-50 px-3.5 py-3 text-base font-medium leading-6 text-gray-900 shadow-md hover:bg-white"
              htmlFor="category-icon-upload"
            >
              Upload Icon
              <input
                className="sr-only"
                id="category-icon-upload"
                type="file"
                accept="image/*"
                onChange={handleIconChange}
              />
            </label>
          </div>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-3.5">
            <div className="grid grid-cols-6 gap-x-4 gap-y-3.5">
              {/* Category Name */}
              <label className="col-span-3 grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Category Name *</span>
                <span className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm leading-[22px] tracking-[0.22px] text-[#475569]">
                  <input
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory && !slug) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")
                        );
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#475569]"
                    placeholder="Enter category name"
                  />
                </span>
              </label>

              {/* Slug */}
              <label className="col-span-3 grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Slug *</span>
                <span className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm leading-[22px] tracking-[0.22px] text-[#475569]">
                  <input
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#475569]"
                    placeholder="category-slug"
                  />
                </span>
              </label>

              {/* Description */}
              <label className="col-span-6 grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Description</span>
                <span className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm leading-[22px] tracking-[0.22px] text-[#475569]">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#475569]"
                    placeholder="Write category description"
                  />
                </span>
              </label>

              {/* Status */}
              <label className="col-span-3 grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Status</span>
                <span className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm leading-[22px] tracking-[0.22px] text-[#475569]">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="min-w-0 flex-1 bg-transparent outline-none text-[#475569]"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="INACTIVE">Draft (Unpublished)</option>
                  </select>
                  <Image src={`${assetBase}imgArrowDown.svg`} alt="" width={24} height={24} />
                </span>
              </label>
            </div>
          </div>

          <div className="flex w-full gap-3 pt-1">
            <button
              className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base leading-6 text-slate-900 hover:bg-slate-100"
              type="button"
              onClick={handleCloseDrawer}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="h-12 flex-1 rounded-xl bg-[#f97316] px-3 py-3 text-base leading-6 text-white hover:opacity-95 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : editingCategory ? "Save Changes" : "Save Category"}
            </button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
