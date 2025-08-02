"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitDataToSheets } from "./actions"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Check, X, Info } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ParsedQuestion {
  question: string
  answer: string
  readMore?: string
}

export default function SubmitDataToSheetsPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [rawData, setRawData] = useState("")
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([])
  const [showPreview, setShowPreview] = useState(false)

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
      setRawData("")
      setParsedData([])
      setShowPreview(false)
    }
  }, [searchParams.get("t")])

  // Parse the pasted data
  const parseData = (data: string): ParsedQuestion[] => {
    if (!data.trim()) return []

    // Split by newlines to get rows
    const rows = data.trim().split(/\r?\n/)

    return rows
      .map((row) => {
        // Split by tabs (Excel/Google Sheets use tabs when copying)
        const columns = row.split("\t")

        return {
          question: columns[0] || "",
          answer: columns[1] || "",
          readMore: columns[2] || "",
        }
      })
      .filter((row) => row.question && row.answer) // Only keep rows with both question and answer
  }

  // Update parsed data when raw data changes
  useEffect(() => {
    const parsed = parseData(rawData)
    setParsedData(parsed)
    setRowCount(parsed.length)
  }, [rawData])

  // Validate title length
  const validateTitle = (value: string) => {
    if (value.length < 10) {
      setTitleError("Please add a minimum of 10 characters for the title of the set. Ideally it should be explanatory.")
      return false
    } else if (value.length > 30) {
      setTitleError("Title should not exceed 30 characters.")
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

  // Handle data change
  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setRawData(value)
  }

  // Toggle preview
  const togglePreview = () => {
    setShowPreview(!showPreview)
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

    // Check if we have enough rows
    if (parsedData.length < 25) {
      setError("Minimum 25 questions and answers required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitDataToSheets(formData)

      if (result.error) {
        setError(result.error)
      } else {
        // Redirect to success page
        window.location.href = `/submit-data-sheets/success?t=${Date.now()}`
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="mx-auto w-full max-w-3xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Submit Your Own Data (Google Sheets)</CardTitle>
          <CardDescription className="text-center">
            We believe in the principle that the knowledge of the masses is powerful and that we can help each other
            study by sharing information and adding to it. As you may know, we mainly organise the information in the
            following format: Question - Short Answer - Read more.
            <br />
            <br />
            Please prepare a table in excel in that same order and prepare MINIMUM 25 questions and answers where the
            "Read more" part is optional.
          </CardDescription>
          <div className="flex justify-center mb-4">
            <Link href="/test-sheets-connection">
              <Button variant="outline" className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200">
                Test Google Sheets Connection
              </Button>
            </Link>
          </div>
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              This form is running in demo mode. In a production environment, it would connect to the actual Google
              Sheets API.
            </AlertDescription>
          </Alert>
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
              <Label htmlFor="topic">Name your study set</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="Enter a descriptive title (10-30 characters)"
                required
                minLength={10}
                maxLength={30}
                value={title}
                onChange={handleTitleChange}
                className={titleError ? "border-red-500" : ""}
              />
              {titleError && <p className="text-sm text-red-500 mt-1">{titleError}</p>}
              <div className="text-xs text-muted-foreground text-right">{title.length}/30 characters</div>
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
              <div className="flex justify-between items-center">
                <Label htmlFor="data">Please copy and paste your data from Excel or Google Sheets here:</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={togglePreview}
                  className="flex items-center gap-1"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> Show Preview
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Format should be: Question &nbsp;&nbsp;&nbsp; Short Answer &nbsp;&nbsp;&nbsp; Read more (optional)
                <br />
                Minimum 25 rows required.
              </p>
              <Textarea
                id="data"
                name="data"
                placeholder="Paste your data here..."
                className="min-h-[200px] font-mono"
                required
                value={rawData}
                onChange={handleDataChange}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  Rows detected: {rowCount || 0}
                  {rowCount !== null && rowCount < 25 ? (
                    <span className="text-red-500"> (minimum 25 required)</span>
                  ) : rowCount !== null && rowCount >= 25 ? (
                    <span className="text-green-500"> ✓</span>
                  ) : null}
                </span>
                {rawData && (
                  <Badge variant={rowCount !== null && rowCount >= 25 ? "success" : "destructive"}>
                    {rowCount !== null && rowCount >= 25 ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <X className="h-3 w-3" /> Invalid
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </div>

            {/* Data Preview Section */}
            {showPreview && parsedData.length > 0 && (
              <div className="border rounded-md p-4 space-y-2">
                <h3 className="font-medium text-sm">Data Preview ({parsedData.length} rows)</h3>
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead>Read More</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.question}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.answer}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.readMore || <span className="text-muted-foreground italic">None</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={
                isSubmitting ||
                !!titleError ||
                title.length < 10 ||
                !!descriptionError ||
                description.length < 25 ||
                parsedData.length < 25
              }
            >
              {isSubmitting ? "Submitting..." : "Submit Your Info to Google Sheets"}
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
