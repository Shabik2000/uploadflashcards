"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchSubmissionById, saveQuestionChanges, saveMainCategory } from "../actions"
import {
  Loader2,
  Home,
  Save,
  ArrowLeft,
  AlertTriangle,
  Edit,
  Check,
  Download,
  Trash2,
  MessageSquare,
  User,
  Clock,
  Filter,
  List,
  Tag,
  Plus,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { convertToCSV, downloadCSV } from "@/utils/csv-export"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useParams, useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

interface Question {
  id: string
  question: string
  answer: string
  readMore?: string
  rating?: number
  adminComment?: string
  reviewerName?: string
  reviewTimestamp?: string
  mainCategory?: string
  subcategory1?: string
  subcategory2?: string
}

interface DataSet {
  id: number
  username: string
  topic: string
  description: string
  questions: Question[]
  totalQuestions: number
  created_at?: string
  submitterLocation?: string
  overallComment?: string
  mainCategory?: string
  subcategory1?: string
  subcategory2?: string
}

// Default new question template
const emptyQuestion: Question = {
  id: "",
  question: "",
  answer: "",
  readMore: "",
  mainCategory: "",
  subcategory1: "",
  subcategory2: "",
}

export default function ReviewSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = Number.parseInt(params.id as string)

  const [currentSet, setCurrentSet] = useState<DataSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedQuestions, setEditedQuestions] = useState<Question[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [reviewerName, setReviewerName] = useState<string>(() => {
    // Try to get the reviewer name from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("reviewerName") || ""
    }
    return ""
  })

  // New question state
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Question>({ ...emptyQuestion })
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Main category state
  const [mainCategory, setMainCategory] = useState("")
  const [editingMainCategory, setEditingMainCategory] = useState(false)
  const [savingMainCategory, setSavingMainCategory] = useState(false)

  // Filter states
  const [showOnlyWithComments, setShowOnlyWithComments] = useState(false)
  const [hideHighRatings, setHideHighRatings] = useState(false)
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])

  // Add these state variables after the existing ones
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)

  // Save reviewer name to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && reviewerName) {
      localStorage.setItem("reviewerName", reviewerName)
    }
  }, [reviewerName])

  // Fetch data on page load
  useEffect(() => {
    const loadData = async () => {
      if (!submissionId || isNaN(submissionId)) {
        setError("Invalid submission ID")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setSaveSuccess(false)
      setDeleteSuccess(false)
      setEditMode(false)
      try {
        const data = await fetchSubmissionById(submissionId)
        if (data) {
          setCurrentSet(data)
          // Make a deep copy of the questions to avoid reference issues
          setEditedQuestions(JSON.parse(JSON.stringify(data.questions)))
          // Set the main category
          setMainCategory(data.mainCategory || "")

          // Update the new question template with the current categories
          setNewQuestion((prev) => ({
            ...prev,
            mainCategory: data.mainCategory || "",
            subcategory1: data.subcategory1 || "",
            subcategory2: data.subcategory2 || "",
          }))
        } else {
          setError("Submission not found")
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load submission. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [submissionId])

  // Apply filters whenever editedQuestions, filter states change
  useEffect(() => {
    if (!editedQuestions.length) {
      setFilteredQuestions([])
      return
    }

    let filtered = [...editedQuestions]

    // Filter by admin comments if enabled
    if (showOnlyWithComments) {
      filtered = filtered.filter((q) => q.adminComment && q.adminComment.trim() !== "")
    }

    // Hide high ratings if enabled
    if (hideHighRatings) {
      filtered = filtered.filter((q) => !q.rating || q.rating < 4)
    }

    setFilteredQuestions(filtered)
  }, [editedQuestions, showOnlyWithComments, hideHighRatings])

  // Handle rating a question - using useCallback to prevent unnecessary re-renders
  const handleRate = useCallback((questionId: string, rating: number) => {
    setEditedQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, rating: rating } : q)))
  }, [])

  // Handle editing a question field - using useCallback to prevent unnecessary re-renders
  const handleEdit = useCallback(
    (questionId: string, field: "question" | "answer" | "readMore" | "adminComment", value: string) => {
      setEditedQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)))
    },
    [],
  )

  // Handle editing the new question
  const handleEditNewQuestion = (field: keyof Question, value: string) => {
    setNewQuestion((prev) => ({ ...prev, [field]: value }))
    setValidationError(null) // Clear validation error when user edits
  }

  // Add this function after the existing useCallback functions
  const checkForUnsavedChanges = useCallback(() => {
    if (!currentSet) return false

    // Compare editedQuestions with original questions
    const originalQuestions = currentSet.questions

    // Check if arrays have different lengths
    if (editedQuestions.length !== originalQuestions.length) {
      return true
    }

    // Check each question for changes
    for (let i = 0; i < editedQuestions.length; i++) {
      const edited = editedQuestions[i]
      const original = originalQuestions[i]

      if (
        edited.question !== original.question ||
        edited.answer !== original.answer ||
        edited.readMore !== original.readMore ||
        edited.adminComment !== original.adminComment ||
        edited.rating !== original.rating
      ) {
        return true
      }
    }

    return false
  }, [editedQuestions, currentSet])

  // Replace the existing toggleEditMode function with this:
  const toggleEditMode = useCallback(() => {
    if (editMode && hasUnsavedChanges) {
      // Show confirmation dialog if there are unsaved changes
      setShowUnsavedChangesDialog(true)
    } else {
      // No unsaved changes, toggle normally
      setEditMode((prevEditMode) => {
        if (prevEditMode) {
          // If turning off edit mode without saving, revert to original data
          if (currentSet) {
            setEditedQuestions(JSON.parse(JSON.stringify(currentSet.questions)))
          }
        }
        return !prevEditMode
      })
    }
  }, [editMode, hasUnsavedChanges, currentSet])

  // Add these functions after the existing callback functions
  const handleDiscardChanges = useCallback(() => {
    // Revert to original data
    if (currentSet) {
      setEditedQuestions(JSON.parse(JSON.stringify(currentSet.questions)))
    }
    setEditMode(false)
    setShowUnsavedChangesDialog(false)
    setHasUnsavedChanges(false)
  }, [currentSet])

  const handleSaveAndExit = async () => {
    if (!currentSet || !reviewerName.trim()) {
      setError("Please enter your name in the reviewer field before saving changes")
      setShowUnsavedChangesDialog(false)
      return
    }

    setSubmitting(true)
    setShowUnsavedChangesDialog(false)
    setError(null)

    try {
      await saveQuestionChanges(currentSet.id, editedQuestions, reviewerName)

      // Update the current set with the edited questions
      setCurrentSet({
        ...currentSet,
        questions: [...editedQuestions],
      })

      setSaveSuccess(true)
      setEditMode(false)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error("Error submitting changes:", err)
      setError(`Failed to save changes: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle main category save
  const handleSaveMainCategory = async () => {
    if (!currentSet || !reviewerName.trim()) {
      setError("Please enter your name before saving the main category")
      return
    }

    setSavingMainCategory(true)
    setError(null)

    try {
      await saveMainCategory(currentSet.id, mainCategory, reviewerName)

      // Update the current set and all questions with the main category
      const updatedQuestions = editedQuestions.map((q) => ({
        ...q,
        mainCategory: mainCategory,
      }))

      setCurrentSet({
        ...currentSet,
        mainCategory: mainCategory,
        questions: updatedQuestions,
      })

      setEditedQuestions(updatedQuestions)
      setEditingMainCategory(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving main category:", err)
      setError(`Failed to save main category: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingMainCategory(false)
    }
  }

  // Handle adding a new question
  const handleAddQuestion = async () => {
    // Validate required fields
    if (!newQuestion.question.trim()) {
      setValidationError("Question is required")
      return
    }
    if (!newQuestion.answer.trim()) {
      setValidationError("Answer is required")
      return
    }
    if (!newQuestion.readMore?.trim()) {
      setValidationError("Read More is required")
      return
    }
    if (!reviewerName.trim()) {
      setValidationError("Please enter your name before adding a question")
      return
    }
    if (!currentSet) {
      setValidationError("No active submission")
      return
    }

    setAddingQuestion(true)
    setValidationError(null)

    try {
      // Create a new question with a UUID
      const questionWithId: Question = {
        ...newQuestion,
        id: uuidv4(),
        reviewerName: reviewerName,
        reviewTimestamp: new Date().toISOString(),
        mainCategory: newQuestion.mainCategory || currentSet.mainCategory || "",
        subcategory1: newQuestion.subcategory1 || currentSet.subcategory1 || "",
        subcategory2: newQuestion.subcategory2 || currentSet.subcategory2 || "",
      }

      // Add the new question to the edited questions array
      const updatedQuestions = [...editedQuestions, questionWithId]

      // Save to database
      await saveQuestionChanges(currentSet.id, updatedQuestions, reviewerName)

      // Update state
      setEditedQuestions(updatedQuestions)
      setCurrentSet({
        ...currentSet,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
      })

      // Reset the new question form
      setNewQuestion({
        ...emptyQuestion,
        mainCategory: currentSet.mainCategory || "",
        subcategory1: currentSet.subcategory1 || "",
        subcategory2: currentSet.subcategory2 || "",
      })
      setShowAddQuestion(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error adding question:", err)
      setValidationError(`Failed to add question: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setAddingQuestion(false)
    }
  }

  // Handle submitting all changes
  const handleSubmit = async () => {
    if (!currentSet) return

    // Check if reviewer name is provided
    if (!reviewerName.trim()) {
      setError("Please enter your name in the reviewer field before saving changes")
      return
    }

    setSubmitting(true)
    setSaveSuccess(false)
    setDeleteSuccess(false)
    setError(null)
    try {
      await saveQuestionChanges(currentSet.id, editedQuestions, reviewerName)

      // Update the current set with the edited questions
      setCurrentSet({
        ...currentSet,
        questions: [...editedQuestions],
      })

      setSaveSuccess(true)
      setEditMode(false)
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error("Error submitting changes:", err)
      setError(`Failed to save changes: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle the download CSV function
  const handleDownloadCSV = useCallback(() => {
    if (!currentSet || !editedQuestions.length) return

    // Format the submission date if available, or use "Not available"
    let formattedDate = "Not available"
    if (currentSet.created_at) {
      try {
        // Try to format the date nicely
        const date = new Date(currentSet.created_at)
        formattedDate = date.toLocaleString()
      } catch (e) {
        // If there's an error parsing the date, use the raw value
        formattedDate = currentSet.created_at
      }
    }

    // Get the username from the current set
    const submittedBy = currentSet.username || "Unknown"
    // Get the location from the current set
    const submitterLocation = currentSet.submitterLocation || "Unknown"

    // Prepare the data for CSV export with additional columns
    const csvData = editedQuestions.map((q, index) => ({
      Number: index + 1,
      MainCategory: q.mainCategory || mainCategory || "",
      Subcategory1: q.subcategory1 || "",
      Subcategory2: q.subcategory2 || "",
      Question: q.question,
      Answer: q.answer,
      ReadMore: q.readMore || "",
      Rating: q.rating || "",
      AdminComment: q.adminComment || "",
      ReviewerName: q.reviewerName || "",
      ReviewTimestamp: q.reviewTimestamp ? new Date(q.reviewTimestamp).toLocaleString() : "",
      SubmittedBy: submittedBy,
      SubmitterLocation: submitterLocation,
      SubmissionDate: formattedDate,
    }))

    // Convert to CSV
    const csv = convertToCSV(csvData)

    // Generate filename with topic and date
    const sanitizedTopic = currentSet.topic.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const date = new Date().toISOString().split("T")[0]
    const filename = `${sanitizedTopic}_${date}.csv`

    // Download the CSV
    downloadCSV(csv, filename)
  }, [currentSet, editedQuestions, mainCategory])

  // Open delete confirmation dialog
  const openDeleteDialog = useCallback((questionId: string) => {
    setQuestionToDelete(questionId)
    setShowDeleteDialog(true)
  }, [])

  // Close delete confirmation dialog
  const closeDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false)
    setQuestionToDelete(null)
  }, [])

  // Handle deleting a question
  const handleDeleteQuestion = async () => {
    if (!questionToDelete || !currentSet) {
      closeDeleteDialog()
      return
    }

    // Check if reviewer name is provided
    if (!reviewerName.trim()) {
      setError("Please enter your name in the reviewer field before deleting questions")
      closeDeleteDialog()
      return
    }

    try {
      // Remove the question from the edited questions array
      const updatedQuestions = editedQuestions.filter((q) => q.id !== questionToDelete)
      setEditedQuestions(updatedQuestions)

      // Save the changes to the database
      await saveQuestionChanges(currentSet.id, updatedQuestions, reviewerName)

      // Update the current set with the updated questions
      setCurrentSet({
        ...currentSet,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
      })

      // Show success message
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (err) {
      console.error("Error deleting question:", err)
      setError(`Failed to delete question: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      closeDeleteDialog()
    }
  }

  // Add this useEffect after the existing ones
  useEffect(() => {
    if (editMode) {
      setHasUnsavedChanges(checkForUnsavedChanges())
    } else {
      setHasUnsavedChanges(false)
    }
  }, [editMode, editedQuestions, checkForUnsavedChanges])

  // Count rated questions
  const ratedCount = editedQuestions.filter((q) => q.rating && q.rating > 0).length

  // Count questions with comments
  const commentedCount = editedQuestions.filter((q) => q.adminComment && q.adminComment.trim() !== "").length

  // Count questions with high ratings (4-5)
  const highRatingCount = editedQuestions.filter((q) => q.rating && q.rating >= 4).length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <Card className="mx-auto w-full max-w-3xl shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Link href="/admin/review-data">
                <Button className="bg-purple-600 hover:bg-purple-700 mr-2">Back to Overview</Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentSet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <Card className="mx-auto w-full max-w-3xl shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Submission Not Found</CardTitle>
            <CardDescription className="text-center">The requested submission could not be found.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/admin/review-data">
              <Button className="bg-purple-600 hover:bg-purple-700 mr-2">Back to Overview</Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine which questions to display based on filters
  const displayQuestions = filteredQuestions.length > 0 ? filteredQuestions : editedQuestions

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/review-data" className="flex items-center text-purple-600 hover:text-purple-700">
            <List className="mr-2 h-5 w-5" />
            <span>Back to Overview</span>
          </Link>
          <h1 className="text-2xl font-bold">Review Submission</h1>
          <Link href="/admin/dashboard" className="flex items-center text-purple-600 hover:text-purple-700">
            <Home className="mr-2 h-5 w-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Reviewer name input */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-grow">
                <Label htmlFor="reviewerName" className="text-sm font-medium">
                  Your Name (for tracking who made changes)
                </Label>
                <Input
                  id="reviewerName"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
            </div>
            {!reviewerName.trim() && (
              <p className="text-amber-600 text-sm mt-2">
                Please enter your name to identify who is making changes to the data.
              </p>
            )}
          </Card>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this question?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the question from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuestion} className="bg-purple-600 hover:bg-purple-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add this dialog after the existing AlertDialog for delete confirmation */}
        {/* Unsaved changes confirmation dialog */}
        <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
              <AlertDialogDescription>
                Click on the button below to save them prior to leaving editing mode. Do you want to save changes or do
                you want to discard changes?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDiscardChanges} className="bg-red-600 hover:bg-red-700 text-white">
                Discard Changes
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveAndExit}
                disabled={submitting || !reviewerName.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {currentSet.topic} <span className="text-sm text-muted-foreground">by {currentSet.username}</span>
                </CardTitle>
                {/* Display submitter's location if available */}
                {currentSet.submitterLocation && currentSet.submitterLocation !== "Unknown" && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-1" />
                    <span>Location: {currentSet.submitterLocation}</span>
                  </div>
                )}
                {/* Display submission date */}
                {currentSet.created_at && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Submitted: {new Date(currentSet.created_at).toLocaleString()}</span>
                  </div>
                )}
                {/* Display overall comment if available */}
                {currentSet.overallComment && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                    <div className="text-sm font-medium text-purple-800">Overall Comment:</div>
                    <div className="text-sm text-purple-700">{currentSet.overallComment}</div>
                  </div>
                )}
              </div>
            </div>
            <CardDescription className="mt-2">
              <div className="text-base text-foreground">{currentSet.description}</div>
            </CardDescription>

            {/* Main Category Section */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Main Category:</span>
                </div>
                {!editingMainCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMainCategory(true)}
                    disabled={!reviewerName.trim()}
                    className="flex items-center"
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    {mainCategory ? "Edit" : "Add"}
                  </Button>
                )}
              </div>

              {editingMainCategory ? (
                <div className="mt-2 space-y-2">
                  <Input
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    placeholder="Enter main category (e.g., Finance, History, Science, etc.)"
                    className="w-full"
                    disabled={!reviewerName.trim()}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveMainCategory}
                      disabled={savingMainCategory || !reviewerName.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {savingMainCategory ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-3 w-3" /> Save
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMainCategory(false)
                        setMainCategory(currentSet.mainCategory || "")
                      }}
                      disabled={savingMainCategory}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  {mainCategory ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-sm px-3 py-1">
                      {mainCategory}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No main category set</span>
                  )}
                </div>
              )}
            </div>

            {/* Filter options */}
            <div className="mt-4 border-t pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Filters:</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showComments"
                      checked={showOnlyWithComments}
                      onCheckedChange={(checked) => setShowOnlyWithComments(checked === true)}
                    />
                    <Label htmlFor="showComments" className="text-sm">
                      Show only with comments ({commentedCount})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hideHighRatings"
                      checked={hideHighRatings}
                      onCheckedChange={(checked) => setHideHighRatings(checked === true)}
                    />
                    <Label htmlFor="hideHighRatings" className="text-sm">
                      Hide ratings 4-5 ({highRatingCount})
                    </Label>
                  </div>
                </div>
              </div>

              {/* Filter status */}
              {(showOnlyWithComments || hideHighRatings) && (
                <div className="mt-2 text-sm">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Showing {filteredQuestions.length} of {editedQuestions.length} questions
                  </Badge>
                  {filteredQuestions.length === 0 && (
                    <span className="ml-2 text-amber-600">No questions match the current filters</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <Badge variant="outline" className="bg-purple-50">
                {editedQuestions.length} questions total
              </Badge>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={ratedCount > 0 ? "bg-purple-50 text-purple-700" : ""}>
                  {ratedCount} of {editedQuestions.length} rated
                </Badge>
                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleEditMode}
                  className={`flex items-center ${editMode ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  disabled={!reviewerName.trim()}
                >
                  {editMode ? (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Editing
                    </>
                  ) : (
                    <>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </>
                  )}
                </Button>

                {/* Download button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="flex items-center bg-transparent"
                  disabled={editedQuestions.length === 0}
                >
                  <Download className="mr-1 h-4 w-4" /> Download CSV
                </Button>
              </div>
            </div>
            {deleteSuccess && (
              <Alert className="mt-2 bg-purple-50 border-purple-200 text-purple-800">
                <Check className="h-4 w-4" />
                <AlertDescription>Question deleted successfully!</AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent>
            {editedQuestions.length === 0 && !showAddQuestion ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Questions</AlertTitle>
                <AlertDescription>This submission doesn't contain any questions to review.</AlertDescription>
              </Alert>
            ) : displayQuestions.length === 0 && !showAddQuestion ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Matching Questions</AlertTitle>
                <AlertDescription>
                  No questions match your current filter settings. Try adjusting the filters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[70vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead className="w-[50px] text-center">Actions</TableHead>
                        <TableHead className="w-[50%]">Question Content</TableHead>
                        <TableHead className="w-[25%]">Review Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayQuestions.map((question, index) => (
                        <TableRow key={question.id} className="border-b">
                          <TableCell className="font-medium align-top">{index + 1}</TableCell>
                          <TableCell className="text-center align-top">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(question.id)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={!reviewerName.trim()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete question</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-4">
                              {/* Categories */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                  Main: {question.mainCategory || mainCategory || "Not set"}
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  Sub1: {question.subcategory1 || "Not set"}
                                </Badge>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                                  Sub2: {question.subcategory2 || "Not set"}
                                </Badge>
                              </div>

                              {/* Question */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-blue-700">
                                  <span>Question:</span>
                                </div>
                                {editMode ? (
                                  <Textarea
                                    key={`question-${question.id}`}
                                    value={question.question}
                                    onChange={(e) => handleEdit(question.id, "question", e.target.value)}
                                    className="min-h-[80px] w-full bg-blue-50"
                                    placeholder="Enter the question..."
                                  />
                                ) : (
                                  <div className="w-full break-words text-sm">
                                    <div className="bg-blue-50 p-3 rounded border font-medium">{question.question}</div>
                                  </div>
                                )}
                              </div>

                              {/* Answer */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-green-700">
                                  <span>Answer:</span>
                                </div>
                                {editMode ? (
                                  <Textarea
                                    key={`answer-${question.id}`}
                                    value={question.answer}
                                    onChange={(e) => handleEdit(question.id, "answer", e.target.value)}
                                    className="min-h-[80px] w-full bg-green-50"
                                    placeholder="Enter the answer..."
                                  />
                                ) : (
                                  <div className="w-full break-words text-sm">
                                    <div className="bg-green-50 p-3 rounded border">{question.answer}</div>
                                  </div>
                                )}
                              </div>

                              {/* Read More */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-gray-700">
                                  <span>Read More:</span>
                                </div>
                                {editMode ? (
                                  <Textarea
                                    key={`readmore-${question.id}`}
                                    value={question.readMore || ""}
                                    onChange={(e) => handleEdit(question.id, "readMore", e.target.value)}
                                    className="min-h-[60px] w-full bg-gray-50"
                                    placeholder="Optional additional information..."
                                  />
                                ) : (
                                  <div className="w-full break-words text-sm">
                                    {question.readMore ? (
                                      <div className="bg-gray-50 p-3 rounded border">{question.readMore}</div>
                                    ) : (
                                      <div className="text-muted-foreground italic bg-gray-50 p-3 rounded border">
                                        No additional information provided
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-4">
                              {/* Rating */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <span>Rating:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <TooltipProvider key={rating}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant={question.rating === rating ? "default" : "outline"}
                                            onClick={() => handleRate(question.id, rating)}
                                            className={`h-8 w-8 p-0 ${
                                              question.rating === rating ? "bg-purple-600 hover:bg-purple-700" : ""
                                            }`}
                                            disabled={!reviewerName.trim()}
                                          >
                                            {rating}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Rate as {rating}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </div>

                              {/* Admin Comment */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  <span>Admin Comment:</span>
                                </div>
                                {editMode ? (
                                  <Textarea
                                    key={`adminComment-${question.id}`}
                                    value={question.adminComment || ""}
                                    onChange={(e) => handleEdit(question.id, "adminComment", e.target.value)}
                                    className="min-h-[80px] w-full"
                                    placeholder="Add admin notes here..."
                                  />
                                ) : (
                                  <div className="w-full break-words text-sm">
                                    {question.adminComment ? (
                                      <div className="text-purple-700 bg-purple-50 p-2 rounded border">
                                        {question.adminComment}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic">No comments</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Reviewer */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>Reviewer:</span>
                                </div>
                                {question.reviewerName ? (
                                  <div className="text-sm">
                                    <div className="flex items-center text-blue-600">
                                      <span className="font-medium">{question.reviewerName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">Not reviewed</span>
                                )}
                              </div>

                              {/* Review Date */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Review Date:</span>
                                </div>
                                {question.reviewTimestamp ? (
                                  <div className="text-sm">
                                    <div>{new Date(question.reviewTimestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(question.reviewTimestamp).toLocaleTimeString(undefined, {
                                        timeStyle: "short",
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">No date</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Add Question Form */}
                      {showAddQuestion && (
                        <TableRow className="border-b bg-purple-50">
                          <TableCell className="font-medium align-top">
                            <span className="text-purple-600">New</span>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <div className="flex flex-col space-y-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowAddQuestion(false)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cancel</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleAddQuestion}
                                      disabled={addingQuestion || !reviewerName.trim()}
                                      className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-50"
                                    >
                                      {addingQuestion ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Save Question</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-4">
                              {/* Categories */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Input
                                  value={newQuestion.mainCategory || ""}
                                  onChange={(e) => handleEditNewQuestion("mainCategory", e.target.value)}
                                  placeholder="Main Category"
                                  className="w-full text-xs mb-2"
                                />
                                <Input
                                  value={newQuestion.subcategory1 || ""}
                                  onChange={(e) => handleEditNewQuestion("subcategory1", e.target.value)}
                                  placeholder="Subcategory 1"
                                  className="w-full text-xs mb-2"
                                />
                                <Input
                                  value={newQuestion.subcategory2 || ""}
                                  onChange={(e) => handleEditNewQuestion("subcategory2", e.target.value)}
                                  placeholder="Subcategory 2"
                                  className="w-full text-xs"
                                />
                              </div>

                              {/* Question */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-blue-700">
                                  <span>Question:</span>
                                </div>
                                <Textarea
                                  value={newQuestion.question}
                                  onChange={(e) => handleEditNewQuestion("question", e.target.value)}
                                  className="min-h-[80px] w-full bg-blue-50"
                                  placeholder="Question (required)"
                                />
                              </div>

                              {/* Answer */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-green-700">
                                  <span>Answer:</span>
                                </div>
                                <Textarea
                                  value={newQuestion.answer}
                                  onChange={(e) => handleEditNewQuestion("answer", e.target.value)}
                                  className="min-h-[80px] w-full bg-green-50"
                                  placeholder="Answer (required)"
                                />
                              </div>

                              {/* Read More */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-gray-700">
                                  <span>Read More:</span>
                                </div>
                                <Textarea
                                  value={newQuestion.readMore || ""}
                                  onChange={(e) => handleEditNewQuestion("readMore", e.target.value)}
                                  className="min-h-[60px] w-full bg-gray-50"
                                  placeholder="Read more information (required)"
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-4">
                              {/* Rating */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <span>Rating:</span>
                                </div>
                                <div className="text-center text-xs text-muted-foreground">Rate after adding</div>
                              </div>

                              {/* Admin Comment */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  <span>Admin Comment:</span>
                                </div>
                                <Textarea
                                  value={newQuestion.adminComment || ""}
                                  onChange={(e) => handleEditNewQuestion("adminComment", e.target.value)}
                                  className="min-h-[80px] w-full"
                                  placeholder="Admin comment (optional)"
                                />
                              </div>

                              {/* Reviewer */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>Reviewer:</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Will be added as: <span className="font-medium">{reviewerName || "Unknown"}</span>
                                </div>
                              </div>

                              {/* Review Date */}
                              <div className="space-y-2">
                                <div className="flex items-center text-sm font-medium text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Review Date:</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Validation error message */}
            {validationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Add Question Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setShowAddQuestion(true)}
                disabled={showAddQuestion || !reviewerName.trim()}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm">
              {saveSuccess && <span className="text-green-600">✓ Changes saved successfully!</span>}
              {error && <span className="text-red-600">✗ {error}</span>}
            </div>
            <div className="flex space-x-2">
              <Link href="/admin/review-data">
                <Button variant="outline" className="flex items-center bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                </Button>
              </Link>
              <Button
                onClick={handleDownloadCSV}
                disabled={editedQuestions.length === 0}
                variant="outline"
                className="flex items-center bg-transparent"
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || editedQuestions.length === 0 || !reviewerName.trim()}
                className="bg-purple-600 hover:bg-purple-700 flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
