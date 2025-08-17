"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Database, LineChart, FileSpreadsheet, LogOut, Mail } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Client-side logout function
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Delete the cookie client-side
      document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      // Navigate to login page
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      // If there's an error, still try to redirect
      router.push("/admin/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/review-data" className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Review Submitted Data</CardTitle>
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardDescription>Review and rate submitted questions and answers from users</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/rate-questions" className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Rate Questions</CardTitle>
                <LineChart className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardDescription>Rate questions from the original rating system</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/newsletter-subscribers" className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Newsletter Subscribers</CardTitle>
                <Mail className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardDescription>View and manage newsletter subscriber emails</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/test-sheets" className="block">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Test Sheets Connection</CardTitle>
                <Database className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardDescription>Test the connection to Google Sheets API</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
