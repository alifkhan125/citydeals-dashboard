import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | CityDeals",
  description: "Terms and Conditions of Service for CityDeals Mobile App and Platforms.",
};

const DEFAULT_TERMS_HTML = `
<div class="space-y-6 text-slate-700 leading-relaxed">
  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">1. Agreement to Terms</h2>
    <p>By downloading, accessing, or using the <strong>CityDeals</strong> mobile application or website, you agree to be bound by these Terms and Conditions. If you do not agree to all terms and conditions set forth herein, you must refrain from using the platform immediately.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">2. User Account Responsibilities</h2>
    <p>When creating an account on CityDeals, you agree to provide true, accurate, and current information. You are responsible for maintaining the confidentiality of your login credentials.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">3. Coupon & Deals Disclaimer (Merchant Offers)</h2>
    <p>Coupons and discounts featured on CityDeals are offered by independent third-party merchants. Each coupon is subject to merchant terms, discount limits, and expiration dates. CityDeals does not directly manufacture or guarantee merchant products or services.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">4. Prohibited Activities</h2>
    <p>Users agree not to attempt to fraudulently duplicate coupon redemptions, reverse-engineer the application, or use automated systems to scrape deals.</p>
  </section>

  <section>
    <h2 class="text-xl font-bold text-slate-900 mb-2">5. Limitation of Liability</h2>
    <p>To the fullest extent permitted by applicable law, CityDeals shall not be liable for merchant service disputes or product defects.</p>
  </section>
</div>
`;

async function getTermsContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://api.citydeals.ai/api";
  try {
    const res = await fetch(`${baseUrl}/legal/terms`, {
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

export default async function TermsAndConditionsPage() {
  const legalData = await getTermsContent();
  const title = legalData?.title || "Terms and Conditions";
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
            <Link href="/privacy" className="hover:text-orange-600 transition-colors">
              Privacy Policy
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
              dangerouslySetInnerHTML={{ __html: DEFAULT_TERMS_HTML }}
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
