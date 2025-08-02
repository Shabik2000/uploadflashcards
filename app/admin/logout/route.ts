import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Delete the admin_auth cookie
    cookies().delete("admin_auth")

    // Use NextResponse for more reliable redirects
    return NextResponse.redirect(new URL("/admin/login", request.url))
  } catch (error) {
    console.error("Logout error:", error)

    // If there's an error, still try to redirect to login
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
}
