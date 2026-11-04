import { redirect } from "next/navigation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const backendBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!backendBaseUrl) {
    return new Response("Share service is not configured", { status: 503 });
  }
  redirect(`${backendBaseUrl}/c/${encodeURIComponent(slug)}/open`);
}
