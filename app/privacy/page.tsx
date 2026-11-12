import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CityDeals",
  description: "Privacy Policy for CityDeals Mobile Application and Platforms.",
};

const DEFAULT_PRIVACY_HTML = `
<div class="space-y-6 text-slate-700 leading-relaxed">
  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">1. Introduction</h2>
    <p>Welcome to <strong>CityDeals</strong> ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs our mobile application and related web platforms.</p>
    <p class="mt-2">If you have any questions or concerns regarding our practices, please contact us at <a href="mailto:support@citydeals.ai" class="font-semibold text-orange-600 hover:underline">support@citydeals.ai</a>.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">2. Information We Collect</h2>
    <ul class="list-disc pl-6 space-y-2 mt-2">
      <li><strong>Account Details:</strong> Your name, email address, phone number, and date of birth (used exclusively for sending birthday gift discounts).</li>
      <li><strong>Foreground GPS Location:</strong> While using the app in foreground, we access your device location to show nearby local merchant deals within 1-1.5 km radius. We do not track location in background.</li>
      <li><strong>Device Identifiers:</strong> Push notification tokens and device OS details to deliver real-time deal alerts.</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">3. Third-Party Services & Authentication</h2>
    <p>We provide secure sign-in via <strong>Google Sign-In</strong> and <strong>Sign in with Apple</strong> in compliance with store guidelines. We never sell or rent your personal information.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">4. Account Deletion & Data Rights</h2>
    <p>You can delete your account and associated records anytime in the app under <strong>Profile &gt; Delete Account</strong>, or via our web deletion portal at <a href="/delete-account" class="font-semibold text-orange-600 hover:underline">https://citydeals.ai/delete-account</a>.</p>
  </section>
</div>
`;

async function getPrivacyContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://api.citydeals.ai/api";
  try {
    const res = await fetch(`${baseUrl}/legal/privacy`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data?.data || data;
  } catch {
    return null;
  }
}

export default async function PrivacyPolicyPage() {
  const legalData = await getPrivacyContent();
  const title = legalData?.title || "Privacy Policy";
  const content = legalData?.content;
  const updatedAt = legalData?.updatedAt
    ? new Date(legalData.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "November 2026";

  const isHtml = content && (content.includes("<p>") || content.includes("<div") || content.includes("<h"));

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
            <Link href="/terms" className="hover:text-orange-600 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/delete-account" className="hover:text-orange-600 transition-colors">
              Delete Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-xs">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Last Updated: {updatedAt}
            </p>
          </div>

          {content ? (
            <div
              className="rich-text-content whitespace-pre-wrap text-base leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div
              className="prose prose-slate max-w-none text-base leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: DEFAULT_PRIVACY_HTML }}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} CityDeals. All rights reserved.</p>
      </footer>
    </div>
  );
}
