"use client"

import type React from "react"

import { useState } from "react"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { subscribeToNewsletter } from "./actions"
import Link from "next/link"

export default function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate a timestamp to prevent caching
  const timestamp = Date.now()

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await subscribeToNewsletter(formData)

      if (result && result.success) {
        setSuccess(true)
        setEmail("")
        setError(null)
      } else if (result && result.error) {
        setError(result.error)
        setSuccess(false)
      } else {
        setError("Failed to subscribe. Please try again.")
        setSuccess(false)
      }
    } catch (err) {
      console.error("Subscription error:", err)
      setError("An unexpected error occurred. Please try again.")
      setSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader className="flex flex-col items-center space-y-2 pt-6">
          <Logo className="h-16 w-16" />
          <h1 className="text-center text-2xl font-bold">Memory Nest - Connect, Request and Share</h1>
          <p className="text-center text-sm text-muted-foreground">
            Memory Nest is a constant work in progress and we need you as a user to keep evolving. Please select one of
            the options below. Please help us by requesting study topics that you are interested in OR submit your own
            questions and answers available for study. You are also very welcome to subscribe to our newsletter, we will
            never send more than one email per month to not clog your inbox.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {success && (
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Thank you for subscribing! Your email has been stored and we will reach out shortly with our news.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe Now"}
              </Button>
            </form>

            <div className="mt-2 space-y-2">
              <Link href={`/submit-data?t=${timestamp}`} className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  Upload Your Own Flashcards
                </Button>
              </Link>
              <Link href={`/request-sets?t=${timestamp}`} className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  Request Study Topics
                </Button>
              </Link>
              {/* Admin and Google Sheets links in a flex container */}
              <div className="flex justify-end mt-4 space-x-4">
                <Link href={`/submit-location?t=${timestamp}`}>
                  <Button variant="ghost" size="sm" className="text-gray-400 text-xs hover:text-gray-500">
                    Update Location
                  </Button>
                </Link>
                <Link href={`/submit-data-sheets?t=${timestamp}`}>
                  <Button variant="ghost" size="sm" className="text-gray-400 text-xs hover:text-gray-500">
                    Google Sheets
                  </Button>
                </Link>
                <Link href="/test-sheets-connection">
                  <Button variant="ghost" size="sm" className="text-gray-400 text-xs hover:text-gray-500">
                    Test Sheets
                  </Button>
                </Link>
                <Link href="/admin/login">
                  <Button variant="ghost" size="sm" className="text-gray-400 text-xs hover:text-gray-500">
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <a href="#" className="hover:underline">
              Terms
            </a>
            <a href="#" className="hover:underline">
              Privacy
            </a>
            <a href="#" className="hover:underline">
              Help
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. We'll never share your information.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
