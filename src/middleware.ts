import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Additional verification can be added here if needed
    // For example, checking if user exists in database
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true if user is authenticated (token exists)
        // This will redirect unauthenticated users to /sign-in
        return !!token
      },
    },
  }
)

export const config = {
  // Define which routes require authentication
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sign-in (sign-in page)
     * - sign-up (sign-up page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up).*)",
  ],
}
