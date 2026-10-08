"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AxiosError } from "axios";
import Modal from "@/components/Modal";
import { uploadImage } from "@/api/upload";
import { type Category, type CategoryPayload } from "@/api/categories";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useCategories";

const assetBase = "/assets/dashboard/";

export default function CategoriesPage() {
  const { data: categoryList = [], isLoading: loading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const saving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Close action menus when clicking outside
  useEffect(() => {
    if (!openActionId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenActionId(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

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

    if (iconPreview && iconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(iconPreview);
    }

    setIconFile(file);
    const nextPreview = URL.createObjectURL(file);
    setIconPreview(nextPreview);
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

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

  function handleOpenNewCategory() {
    setOpenActionId(null);
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(categoryList.length + 1);
    setStatus("ACTIVE");
    setIconFile(null);
    setIconPreview(null);
    setIsDrawerOpen(true);
  }

  function handleEditCategory(category: Category) {
    setOpenActionId(null);
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setSortOrder(category.sortOrder ?? 0);
    setStatus(category.status);
    setIconFile(null);
    setIconPreview(category.iconUrl || null);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditingCategory(null);
    if (iconPreview && iconPreview.startsWith("blob:")) {
      URL.revokeObjectURL(iconPreview);
    }
    setIconFile(null);
    setIconPreview(null);
  }

  async function handleToggleStatus(category: Category) {
    setOpenActionId(null);
    const newStatus = category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateCategoryMutation.mutate(
      { id: category.id, payload: { status: newStatus } },
      {
        onSuccess: () => {
          showToast(`${category.name} ${newStatus === "ACTIVE" ? "published" : "unpublished"}`);
        },
        onError: (error) => {
          console.error("Failed to toggle status:", error);
          showToast(getErrorMessage(error, "Failed to update category status"));
        },
      },
    );
  }

  async function handleDeleteCategory(category: Category) {
    setOpenActionId(null);
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) return;
    deleteCategoryMutation.mutate(category.id, {
      onSuccess: () => {
        showToast(`Deleted ${category.name}`);
      },
      onError: (error) => {
        console.error("Failed to delete category:", error);
        showToast(getErrorMessage(error, "Failed to delete category"));
      },
    });
  }

  async function handleSaveCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      showToast("Category name is required");
      return;
    }

    try {
      let uploadedIconUrl = editingCategory?.iconUrl || undefined;

      if (iconFile) {
        try {
          showToast("Uploading category icon...");
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

      const payload: CategoryPayload = {
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        status,
        ...(uploadedIconUrl ? { iconUrl: uploadedIconUrl } : {}),
      };

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, payload });
        showToast(`Updated ${name.trim()}`);
      } else {
        await createCategoryMutation.mutateAsync(payload);
        showToast(`Created ${name.trim()}`);
      }

      handleCloseDrawer();
    } catch (err: unknown) {
      console.error("Failed to save category:", err);
      showToast(getErrorMessage(err, "Failed to save category"));
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categoryList.filter((category) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        category.name.toLowerCase().includes(q) ||
        category.slug.toLowerCase().includes(q) ||
        (category.description && category.description.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categoryList, searchQuery, statusFilter]);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-[#d1d5db] bg-white p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-lg font-semibold leading-6 text-slate-900">
              Coupon Categories
            </h1>
            <p className="mt-1 text-sm leading-5 text-[#475569]">
              Categories drive how shoppers filter offers and mobile discovery ({categoryList.length} total)
            </p>
          </div>
          <button
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-95 sm:w-auto"
            type="button"
            onClick={handleOpenNewCategory}
          >
            <Image src={`${assetBase}imgAdd.svg`} alt="" width={20} height={20} />
            Add New Category
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Image src={`${assetBase}imgSearchNormal.svg`} alt="" width={18} height={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories by name, slug or description..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#f97316] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Draft / Inactive</option>
            </select>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading categories from server...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-[#f97316]">
              <Image src={`${assetBase}imgTag2.svg`} alt="" width={24} height={24} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No categories found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search query or filter."
                : "No categories created yet. Click 'Add New Category' to create your first one."}
            </p>
            <button
              onClick={handleOpenNewCategory}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-95"
            >
              + Add your first category
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredCategories.map((category) => (
                <article
                  className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={category.id || category.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <Image
                          className="object-cover"
                          src={category.iconUrl || `${assetBase}imgLocationAvatar.png`}
                          alt={category.name}
                          fill
                          sizes="44px"
                        />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {category.name}
                        </h2>
                        <p className="truncate text-xs text-slate-500">
                          /{category.slug}
                        </p>
                      </div>
                    </div>

                    <div className="relative shrink-0 action-menu-container">
                      <button
                        aria-expanded={openActionId === category.id}
                        aria-label={`Open actions for ${category.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        type="button"
                        onClick={() =>
                          setOpenActionId((currentId) =>
                            currentId === category.id ? null : category.id
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionId === category.id && (
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl animate-in fade-in zoom-in-95 duration-100">
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

                  <p className="mt-3 text-sm leading-5 text-slate-700">
                    {category.description || "—"}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      {category._count ? (
                        <>
                          <strong className="text-slate-900">{category._count.coupons}</strong> coupons •{" "}
                          <strong className="text-slate-900">{category._count.merchants}</strong> merchants
                        </>
                      ) : (
                        `Order #${category.sortOrder ?? 0}`
                      )}
                    </span>
                    <span
                      className={
                        category.status === "ACTIVE"
                          ? "inline-flex h-6 items-center rounded-full bg-emerald-100 px-2.5 text-xs font-medium text-[#16a34a]"
                          : "inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {category.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="mt-4 hidden overflow-visible rounded-lg border border-slate-200 lg:block">
              <div className="grid h-[55px] grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.5fr)_130px_90px_110px_80px] items-center bg-slate-100 text-sm font-medium leading-5 text-[#315576]">
                {[
                  "Category Name",
                  "Description",
                  "Attached Deals",
                  "Order",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <div className="border-r border-slate-300 px-3 last:border-r-0" key={heading}>
                    {heading}
                  </div>
                ))}
              </div>

              {filteredCategories.map((category) => (
                <div
                  className="grid h-[56px] grid-cols-[minmax(220px,1.2fr)_minmax(220px,1.5fr)_130px_90px_110px_80px] items-center border-b border-dashed border-slate-200 bg-white last:border-b-0 hover:bg-slate-50/50 transition-colors"
                  key={category.id || category.slug}
                >
                  {/* Name + Icon */}
                  <div className="flex min-w-0 items-center gap-3 px-3 py-2">
                    <span className="relative size-8 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                      <Image
                        className="object-cover"
                        src={category.iconUrl || `${assetBase}imgLocationAvatar.png`}
                        alt={category.name}
                        fill
                        sizes="32px"
                      />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium leading-5 text-slate-900">
                        {category.name}
                      </strong>
                      <small className="block truncate text-xs leading-4 text-[#475569]">
                        /{category.slug}
                      </small>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="truncate px-3 text-sm leading-5 text-slate-700">
                    {category.description || "—"}
                  </p>

                  {/* Usage / Attached Deals */}
                  <div className="px-3">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {category._count?.coupons ?? 0} coupons • {category._count?.merchants ?? 0} biz
                    </span>
                  </div>

                  {/* Order */}
                  <div className="px-3 text-sm font-mono text-slate-700">
                    #{category.sortOrder ?? 0}
                  </div>

                  {/* Status */}
                  <div className="px-3">
                    <span
                      className={
                        category.status === "ACTIVE"
                          ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2 text-xs font-medium leading-5 text-[#16a34a]"
                          : "inline-flex h-6 items-center rounded bg-slate-100 px-2 text-xs font-medium leading-5 text-slate-600"
                      }
                    >
                      {category.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative flex justify-center px-3 action-menu-container">
                    <button
                      aria-expanded={openActionId === category.id}
                      aria-label={`Open actions for ${category.name}`}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                      type="button"
                      onClick={() =>
                        setOpenActionId((currentId) =>
                          currentId === category.id ? null : category.id
                        )
                      }
                    >
                      ⋮
                    </button>
                    {openActionId === category.id && (
                      <div className="absolute right-3 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl animate-in fade-in zoom-in-95 duration-100">
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
          </>
        )}
      </section>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        subtitle={
          editingCategory
            ? `Update details for ${editingCategory.name}`
            : "Enter category details for deals discovery"
        }
        maxWidth="max-w-[580px]"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSaveCategory}>
          {/* Icon Upload Card */}
          <div className="flex w-full items-center gap-5 rounded-2xl border border-[#e5e7eb] bg-gray-50 p-4">
            <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-[#d1d5db] bg-white shadow-inner">
              {iconPreview ? (
                <Image
                  className="object-cover"
                  src={iconPreview}
                  alt=""
                  fill
                  sizes="64px"
                />
              ) : (
                <Image src={`${assetBase}imgTag2.svg`} alt="" width={32} height={32} />
              )}
            </div>
            <div className="flex-1">
              <label
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100"
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
              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG, SVG or WebP up to 10MB
              </p>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {/* Category Name */}
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-700">
                  Category Name <span className="text-red-500">*</span>
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")
                        );
                      }
                    }}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. Restaurants"
                  />
                </span>
              </label>

              {/* Slug */}
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-700">
                  URL Slug <span className="text-red-500">*</span>
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="restaurants"
                  />
                </span>
              </label>

              {/* Description */}
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-700">Description</span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="Short description for app categories and SEO"
                  />
                </span>
              </label>

              {/* Sort Order */}
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-700">Sort Order</span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400 font-mono"
                    placeholder="1"
                  />
                </span>
              </label>

              {/* Status */}
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-700">Status</span>
                <span className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="INACTIVE">Draft (Hidden)</option>
                  </select>
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3 pt-2">
            <button
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              type="button"
              onClick={handleCloseDrawer}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : editingCategory ? (
                "Save Changes"
              ) : (
                "Save Category"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
