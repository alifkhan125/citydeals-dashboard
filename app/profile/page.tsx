"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useDashboardProfile, useUpdateDashboardProfile } from "@/hooks/useDashboardProfile";
import { toast } from "@/components/Toast";
import { uploadImage } from "@/api/upload";

const assetBase = "/assets/dashboard/";

export default function ProfilePage() {
  const { data: user, isLoading } = useDashboardProfile();
  const updateProfile = useUpdateDashboardProfile();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || "");
    setPhoneNumber(user?.phoneNumber || "");
    setProfilePictureUrl(user?.profilePictureUrl || "");
    setDateOfBirth(user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
  }, [user?.dateOfBirth, user?.fullName, user?.phoneNumber, user?.profilePictureUrl]);

  const avatarSrc = useMemo(() => {
    if (profilePictureUrl.trim()) return profilePictureUrl.trim();
    if (fullName.trim()) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=ea580c&color=ffffff&bold=true`;
    }
    return `${assetBase}imgAdminAvatarNew.png`;
  }, [fullName, profilePictureUrl]);

  function getErrorMessage(error: unknown) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
    }
    if (error instanceof Error) return error.message;
    return "Failed to update profile";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    await updateProfile.mutateAsync({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      profilePictureUrl: profilePictureUrl.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
    }).then(() => {
      toast.success("Admin profile updated");
    }).catch((error) => {
      toast.error(getErrorMessage(error));
    });
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const uploaded = await uploadImage(file, "avatars");
      const url = uploaded.secureUrl || uploaded.url;
      setProfilePictureUrl(url);
      toast.success("Photo uploaded. Click Save profile to apply it.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-3 sm:p-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center sm:flex-row sm:gap-4 sm:text-left">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#0c4a6e] p-1">
            <Image
              className="size-full rounded-xl object-cover"
              src={avatarSrc}
              alt=""
              width={72}
              height={72}
              unoptimized={avatarSrc.startsWith("http")}
            />
          </span>
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-semibold leading-8 text-slate-900">
              {isLoading ? "Loading..." : user?.fullName || "Admin"}
            </h1>
            <p className="mt-1 break-all text-sm leading-5 text-[#475569] sm:break-normal">
              {user?.email || "admin@citydeals"}
            </p>
          </div>
        </div>

        <form className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4" onSubmit={handleSubmit}>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#0c4a6e] p-1">
              <Image
                className="size-full rounded-lg object-cover"
                src={avatarSrc}
                alt=""
                width={56}
                height={56}
                unoptimized={avatarSrc.startsWith("http")}
              />
            </span>
            <div className="flex-1">
              <label
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100"
                htmlFor="admin-profile-photo"
              >
                {isUploadingPhoto ? "Uploading..." : "Upload photo"}
                <input
                  className="sr-only"
                  id="admin-profile-photo"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingPhoto}
                  onChange={handlePhotoUpload}
                />
              </label>
              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG or WebP. Upload first, then save profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              required
            />
            <Field
              label="Email"
              value={user?.email || ""}
              readOnly
            />
            <Field
              label="Phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
            />
            <Field
              label="Profile image URL"
              value={profilePictureUrl}
              onChange={setProfilePictureUrl}
            />
            <Field
              label="Date of birth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              type="date"
            />
            <Field
              label="Role"
              value={user?.role || ""}
              readOnly
            />
            <Field
              label="Status"
              value={user?.status || "ACTIVE"}
              readOnly
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="h-11 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
              disabled={updateProfile.isPending || isLoading}
            >
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm leading-5 text-slate-900">{label}</span>
      <input
        className={`h-[42px] rounded-lg border border-slate-200 px-3 text-sm leading-[22px] text-[#475569] outline-none ${
          readOnly ? "bg-slate-100" : "bg-white focus:border-[#f97316]"
        }`}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        required={required}
        type={type}
      />
    </label>
  );
}
