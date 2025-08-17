"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { saveSubmitterLocation } from "../admin/review-data/actions"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, MapPin } from "lucide-react"

export default function SubmitLocationPage() {
  const [username, setUsername] = useState("")
  const [location, setLocation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !location.trim()) {
      setError("Both username and location are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("username", username)
      formData.append("location", location)

      const result = await saveSubmitterLocation(formData)

      if (result.success) {
        setSuccess(true)
        // Save to localStorage for future use
        if (typeof window !== "undefined") {
          localStorage.setItem("userLocation", location)
        }
      } else {
        setError(result.error || "Failed to save location")
      }
    } catch (err) {
      console.error("Error saving location:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-center text-2xl">Update Your Location</CardTitle>
          <CardDescription className="text-center">
            Help us track where our content is coming from by providing your location information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription className="text-blue-800">
                Your location has been updated successfully. All your submissions will now show this location.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Your Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              <p className="text-xs text-muted-foreground">
                This should match the username you used when submitting flashcards.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Your Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., United States, Germany, etc."
                required
              />
              <p className="text-xs text-muted-foreground">
                Please provide your country or region to help us understand where our content is coming from.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !username.trim() || !location.trim()}
            >
              {isSubmitting ? "Updating..." : "Update Location"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
