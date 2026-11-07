import { NextResponse, type NextRequest } from "next/server";

// Password-protects the staff app when PRIMP_PASSWORD is set.
// The public enquiry page and the Meta webhook stay open.
export function middleware(req: NextRequest) {
  const password = process.env.PRIMP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Login required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Primp staff"' },
  });
}

export const config = {
  matcher: ["/((?!enquiry|api/meta|_next/static|_next/image|favicon.ico).*)"],
};
