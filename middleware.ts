import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const PROTECTED_PATHS = [
  "/cari-pakar",
  "/knowledge-hub",
  "/konsultasi",
  "/forum",
  "/profil",
  "/admin",
  "/onboarding",
  "/jurnal",
  "/action-plan",
  "/ai-assistant",
  "/api/assessments",
  "/api/consultations",
  "/api/chat",
  "/api/experts",
  "/api/users/profile",
  "/api/payments/premium",
  "/api/payments/history",
  "/api/journal",
  "/api/action-plans",
  "/api/ai-chat",
  "/api/notifications",
  "/api/onboarding",
];

// Admin-only paths
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) return NextResponse.next();

  const session = await auth();

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
