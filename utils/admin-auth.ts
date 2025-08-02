"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Simple admin authentication for demo purposes
// In a real application, you would use a more secure authentication method
const ADMIN_PASSWORD = "hejbaberiba" // Updated password

export async function checkAdminAuth() {
  const cookieStore = cookies()
  const isAdmin = cookieStore.get("admin_auth")

  if (!isAdmin || isAdmin.value !== "true") {
    return false
  }

  return true
}

export async function adminLogin(formData: FormData) {
  const password = formData.get("password") as string

  if (password === ADMIN_PASSWORD) {
    cookies().set("admin_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return { success: true }
  }

  return { success: false, error: "Invalid password" }
}

export async function adminLogout() {
  try {
    cookies().delete("admin_auth")
  } catch (error) {
    console.error("Error deleting admin cookie:", error)
  }

  // Use a relative URL for more reliable redirects
  redirect("/admin/login")
}

export async function requireAdmin() {
  const isAdmin = await checkAdminAuth()

  if (!isAdmin) {
    redirect("/admin/login")
  }
}
