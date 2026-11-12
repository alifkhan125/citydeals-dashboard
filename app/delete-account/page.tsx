"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.citydeals.ai/api";

export default function DeleteAccountPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  // Step 1: Request OTP with credentials
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/request-deletion-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to verify credentials. Please try again.");
      }

      setStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || "An error occurred while verifying credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and trigger account deletion
  const handleVerifyAndDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-and-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Invalid or expired OTP code.");
      }

      setIsDeleted(true);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to confirm account deletion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-orange-600">
              City<span className="text-slate-900">Deals</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/privacy" className="hover:text-orange-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-orange-600 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Delete CityDeals Account
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Permanent erasure of user data in compliance with Google Play and Apple App Store policies.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Verification Failed</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          )}

          {isDeleted ? (
            /* Success State */
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-emerald-800">Account Permanently Deleted</h2>
              <p className="mt-2 text-sm text-emerald-700">
                Your account for <strong>{email}</strong> and all associated saved coupons, redemptions, and personal profile data have been permanently removed from our databases.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          ) : step === 1 ? (
            /* Step 1: Email and Password verification */
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <p className="text-sm text-slate-600">
                Please enter your registered CityDeals email address and password to request a secure 6-digit confirmation code.
              </p>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Account Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
                <strong>Irreversible Action:</strong> Deleting your account will immediately revoke access and permanently remove all saved deals, bookmarks, and coupon history.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying Credentials..." : "Continue & Send Deletion Code"}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Entry */
            <form onSubmit={handleVerifyAndDelete} className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                We sent a 6-digit verification code to <strong>{email}</strong>. Please check your inbox (and spam folder) and enter it below.
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-2xl font-bold rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Deleting Account..." : "Confirm & Delete Account Permanently"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMessage(null);
                  setOtp("");
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition"
              >
                &larr; Back to Email / Change Credentials
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            Need assistance? Reach our support team at{" "}
            <a href="mailto:support@citydeals.ai" className="font-semibold text-orange-600 hover:underline">
              support@citydeals.ai
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
