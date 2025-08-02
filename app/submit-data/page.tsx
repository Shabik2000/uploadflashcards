"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitUserData } from "../submit-data-action"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SubmitDataPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState(() => {
    // Try to get the location from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("userLocation") || ""
    }
    return ""
  })

  // Save location to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && location) {
      localStorage.setItem("userLocation", location)
    }
  }, [location])

  // Reset form when timestamp changes (new visit)
  useEffect(() => {
    if (formRef.current) {
      formRef.current.reset()
      setError(null)
      setRowCount(null)
      setTitleError(null)
      setTitle("")
      setDescriptionError(null)
      setDescription("")
      // Don't reset location as we want to remember it
    }
  }, [searchParams.get("t")])

  // Validate title length - increased max to 38 characters
  const validateTitle = (value: string) => {
    if (value.length < 10) {
      setTitleError("Please add a minimum of 10 characters for the title of the set. Ideally it should be explanatory.")
      return false
    } else if (value.length > 38) {
      setTitleError("Title should not exceed 38 characters.")
      return false
    } else {
      setTitleError(null)
      return true
    }
  }

  // Validate description length
  const validateDescription = (value: string) => {
    if (value.length < 25) {
      setDescriptionError("Please add a minimum of 25 characters for the description.")
      return false
    } else if (value.length > 110) {
      setDescriptionError("Description should not exceed 110 characters.")
      return false
    } else {
      setDescriptionError(null)
      return true
    }
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTitle(value)
    validateTitle(value)
  }

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDescription(value)
    validateDescription(value)
  }

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    // Validate title and description before submission
    const titleValue = formData.get("topic") as string
    const descriptionValue = formData.get("description") as string

    const isTitleValid = validateTitle(titleValue)
    const isDescriptionValid = validateDescription(descriptionValue)

    if (!isTitleValid || !isDescriptionValid) {
      return // Prevent submission if fields are invalid
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitUserData(formData)

      if (result.success && result.redirectTo) {
        // Redirect to success page
        router.push(result.redirectTo)
      } else if (result.error) {
        setError(result.error)
        if (result.rowCount !== undefined) {
          setRowCount(result.rowCount)
        }
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="mx-auto w-full max-w-3xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Upload Your Own Flashcards</CardTitle>
          <CardDescription className="text-center">
            We believe in the principle that the knowledge of the masses is powerful and that we can help each other
            study by sharing information and adding to it. As you may know, we mainly organise the information in the
            following format: Question - Short Answer - Read more.
            <br />
            <br />
            Please prepare a table in excel in that same order and prepare MINIMUM 25 questions and answers where the
            "Read more" part is optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {rowCount !== null && rowCount < 25 && (
                  <span> (You provided {rowCount} rows, but 25 are required)</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                What is your username on MemoryNest? We will use it to pair it to your account
              </Label>
              <Input id="username" name="username" placeholder="Your username" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Your Location (Country/Region)</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., United States, Germany, etc."
                value={location}
                onChange={handleLocationChange}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Helps us understand where our content is coming from.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Name your study set</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="Enter a descriptive title (10-38 characters)"
                required
                minLength={10}
                maxLength={38}
                value={title}
                onChange={handleTitleChange}
                className={titleError ? "border-red-500" : ""}
              />
              {titleError && <p className="text-sm text-red-500 mt-1">{titleError}</p>}
              <div className="text-xs text-muted-foreground text-right">{title.length}/38 characters</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Set description. Please enter a phrase or two that explains what type of information is inside the set.
                This is longer than the set title name which should be shorter.
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Enter a detailed description (25-110 characters)"
                required
                minLength={25}
                maxLength={110}
                value={description}
                onChange={handleDescriptionChange}
                className={descriptionError ? "border-red-500" : ""}
              />
              {descriptionError && <p className="text-sm text-red-500 mt-1">{descriptionError}</p>}
              <div className="text-xs text-muted-foreground text-right">{description.length}/110 characters</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Please copy and paste your data from Excel or Google Sheets here:</Label>
              <p className="text-sm text-muted-foreground">
                Format should be: Question &nbsp;&nbsp;&nbsp; Short Answer &nbsp;&nbsp;&nbsp; Read more (optional)
                <br />
                Minimum 25 rows required.
              </p>
              <Textarea
                id="data"
                name="data"
                placeholder="Paste your data here..."
                className="min-h-[300px] font-mono"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={
                isSubmitting || !!titleError || title.length < 10 || !!descriptionError || description.length < 25
              }
            >
              {isSubmitting ? "Submitting..." : "Submit Your Flashcards"}
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
