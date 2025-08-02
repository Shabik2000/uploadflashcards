"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  fetchAllSubmissions,
  saveSubmissionComment,
  fetchUnreviewedCounts,
  deleteSubmission,
  saveMainCategory,
  saveSubcategory1,
  saveSubcategory2,
  fetchAllQuestionsForExport, // Add this new import
} from "./actions"

// Add this import for the CSV export utilities
import { convertToCSV, downloadCSV } from "@/utils/csv-export"
import {
  Loader2,
  Home,
  AlertTriangle,
  FileText,
  HelpCircle,
  Calendar,
  User,
  MessageSquare,
  Eye,
  Edit,
  Check,
  Trash2,
  Tag,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface SubmissionOverview {
  id: number
  username: string
  topic: string
  description: string
  totalQuestions: number
  unratedQuestions: number
  created_at: string
  submitterLocation?: string
  overallComment?: string
  mainCategory?: string
  subcategory1?: string
  subcategory2?: string
}

export default function ReviewOverviewPage() {
  const [submissions, setSubmissions] = useState<SubmissionOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [commentValues, setCommentValues] = useState<Record<number, string>>({})
  const [savingComment, setSavingComment] = useState<number | null>(null)
  const [reviewerName, setReviewerName] = useState<string>(() => {
    // Try to get the reviewer name from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("reviewerName") || ""
    }
    return ""
  })

  // Add these state variables after the existing ones
  const [prioritySubmissions, setPrioritySubmissions] = useState<Set<number>>(new Set())
  const [deletingSubmission, setDeletingSubmission] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null)

  // Add these state variables after the existing ones
  const [editingMainCategory, setEditingMainCategory] = useState<number | null>(null)
  const [mainCategoryValues, setMainCategoryValues] = useState<Record<number, string>>({})
  const [savingMainCategory, setSavingMainCategory] = useState<number | null>(null)

  // Add these state variables after the main category ones
  const [editingSubcategory1, setEditingSubcategory1] = useState<number | null>(null)
  const [subcategory1Values, setSubcategory1Values] = useState<Record<number, string>>({})
  const [savingSubcategory1, setSavingSubcategory1] = useState<number | null>(null)

  const [editingSubcategory2, setEditingSubcategory2] = useState<number | null>(null)
  const [subcategory2Values, setSubcategory2Values] = useState<Record<number, string>>({})
  const [savingSubcategory2, setSavingSubcategory2] = useState<number | null>(null)

  // Unreviewed counts
  const [unreviewedCounts, setUnreviewedCounts] = useState({
    unreviewedSubmissions: 0,
    unreviewedQuestions: 0,
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Add these new state variables after the other state declarations
  const [exportingAllQuestions, setExportingAllQuestions] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Save reviewer name to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && reviewerName) {
      localStorage.setItem("reviewerName", reviewerName)
    }
  }, [reviewerName])

  // Fetch unreviewed counts on component mount
  useEffect(() => {
    const loadCounts = async () => {
      setCountsLoading(true)
      try {
        const counts = await fetchUnreviewedCounts()
        setUnreviewedCounts(counts)
      } catch (err) {
        console.error("Error loading unreviewed counts:", err)
      } finally {
        setCountsLoading(false)
      }
    }

    loadCounts()
  }, [])

  // Fetch submissions on component mount
  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAllSubmissions()
        setSubmissions(data)

        // Initialize comment values
        const initialComments: Record<number, string> = {}
        data.forEach((submission) => {
          initialComments[submission.id] = submission.overallComment || ""
        })
        setCommentValues(initialComments)

        // In the loadSubmissions function, after setSubmissions(data), add:
        // Initialize main category values
        const initialMainCategories: Record<number, string> = {}
        data.forEach((submission) => {
          initialMainCategories[submission.id] = submission.mainCategory || ""
        })
        setMainCategoryValues(initialMainCategories)

        // Initialize subcategory values
        const initialSubcategory1: Record<number, string> = {}
        const initialSubcategory2: Record<number, string> = {}
        data.forEach((submission) => {
          initialSubcategory1[submission.id] = submission.subcategory1 || ""
          initialSubcategory2[submission.id] = submission.subcategory2 || ""
        })
        setSubcategory1Values(initialSubcategory1)
        setSubcategory2Values(initialSubcategory2)
      } catch (err) {
        console.error("Error loading submissions:", err)
        setError("Failed to load submissions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [])

  // Handle editing comment
  const handleEditComment = useCallback((submissionId: number) => {
    setEditingComment(submissionId)
  }, [])

  // Handle saving comment
  const handleSaveComment = async (submissionId: number) => {
    if (!reviewerName.trim()) {
      setError("Please enter your name before saving comments")
      return
    }

    setSavingComment(submissionId)
    setError(null)

    try {
      const comment = commentValues[submissionId] || ""
      await saveSubmissionComment(submissionId, comment, reviewerName)

      // Update the submission in the local state
      setSubmissions((prev) => prev.map((sub) => (sub.id === submissionId ? { ...sub, overallComment: comment } : sub)))

      setEditingComment(null)
    } catch (err) {
      console.error("Error saving comment:", err)
      setError(`Failed to save comment: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingComment(null)
    }
  }

  // Handle comment value change
  const handleCommentChange = useCallback((submissionId: number, value: string) => {
    setCommentValues((prev) => ({
      ...prev,
      [submissionId]: value,
    }))
  }, [])

  // Cancel editing
  const handleCancelEdit = useCallback(
    (submissionId: number) => {
      // Reset to original value
      const originalComment = submissions.find((s) => s.id === submissionId)?.overallComment || ""
      setCommentValues((prev) => ({
        ...prev,
        [submissionId]: originalComment,
      }))
      setEditingComment(null)
    },
    [submissions],
  )

  // Handle priority toggle
  const handlePriorityToggle = useCallback((submissionId: number) => {
    setPrioritySubmissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }, [])

  // Handle delete submission
  const handleDeleteSubmission = useCallback((submissionId: number) => {
    setSubmissionToDelete(submissionId)
    setShowDeleteDialog(true)
  }, [])

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false)
    setSubmissionToDelete(null)
  }, [])

  // Confirm delete submission
  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete || !reviewerName.trim()) {
      setError("Please enter your name before deleting submissions")
      closeDeleteDialog()
      return
    }

    setDeletingSubmission(submissionToDelete)
    setError(null)

    try {
      await deleteSubmission(submissionToDelete, reviewerName)

      // Remove from local state
      setSubmissions((prev) => prev.filter((sub) => sub.id !== submissionToDelete))

      // Remove from priority set if it was there
      setPrioritySubmissions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(submissionToDelete)
        return newSet
      })

      // Refresh counts
      const counts = await fetchUnreviewedCounts()
      setUnreviewedCounts(counts)
    } catch (err) {
      console.error("Error deleting submission:", err)
      setError(`Failed to delete submission: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeletingSubmission(null)
      closeDeleteDialog()
    }
  }

  // Handle editing main category
  const handleEditMainCategory = useCallback((submissionId: number) => {
    setEditingMainCategory(submissionId)
  }, [])

  // Handle saving main category
  const handleSaveMainCategory = async (submissionId: number) => {
    if (!reviewerName.trim()) {
      setError("Please enter your name before saving main category")
      return
    }

    setSavingMainCategory(submissionId)
    setError(null)

    try {
      const category = mainCategoryValues[submissionId] || ""
      await saveMainCategory(submissionId, category, reviewerName)

      // Update the submission in the local state
      setSubmissions((prev) => prev.map((sub) => (sub.id === submissionId ? { ...sub, mainCategory: category } : sub)))

      setEditingMainCategory(null)
    } catch (err) {
      console.error("Error saving main category:", err)
      setError(`Failed to save main category: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingMainCategory(null)
    }
  }

  // Cancel main category editing
  const handleCancelMainCategoryEdit = useCallback(
    (submissionId: number) => {
      // Reset to original value
      const originalCategory = submissions.find((s) => s.id === submissionId)?.mainCategory || ""
      setMainCategoryValues((prev) => ({
        ...prev,
        [submissionId]: originalCategory,
      }))
      setEditingMainCategory(null)
    },
    [submissions],
  )

  // Handle editing subcategory1
  const handleEditSubcategory1 = useCallback((submissionId: number) => {
    setEditingSubcategory1(submissionId)
  }, [])

  // Handle saving subcategory1
  const handleSaveSubcategory1 = async (submissionId: number) => {
    if (!reviewerName.trim()) {
      setError("Please enter your name before saving subcategory1")
      return
    }

    setSavingSubcategory1(submissionId)
    setError(null)

    try {
      const subcategory = subcategory1Values[submissionId] || ""
      await saveSubcategory1(submissionId, subcategory, reviewerName)

      // Update the submission in the local state
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, subcategory1: subcategory } : sub)),
      )

      setEditingSubcategory1(null)
    } catch (err) {
      console.error("Error saving subcategory1:", err)
      setError(`Failed to save subcategory1: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingSubcategory1(null)
    }
  }

  // Cancel subcategory1 editing
  const handleCancelSubcategory1Edit = useCallback(
    (submissionId: number) => {
      // Reset to original value
      const originalSubcategory = submissions.find((s) => s.id === submissionId)?.subcategory1 || ""
      setSubcategory1Values((prev) => ({
        ...prev,
        [submissionId]: originalSubcategory,
      }))
      setEditingSubcategory1(null)
    },
    [submissions],
  )

  // Handle editing subcategory2
  const handleEditSubcategory2 = useCallback((submissionId: number) => {
    setEditingSubcategory2(submissionId)
  }, [])

  // Handle saving subcategory2
  const handleSaveSubcategory2 = async (submissionId: number) => {
    if (!reviewerName.trim()) {
      setError("Please enter your name before saving subcategory2")
      return
    }

    setSavingSubcategory2(submissionId)
    setError(null)

    try {
      const subcategory = subcategory2Values[submissionId] || ""
      await saveSubcategory2(submissionId, subcategory, reviewerName)

      // Update the submission in the local state
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, subcategory2: subcategory } : sub)),
      )

      setEditingSubcategory2(null)
    } catch (err) {
      console.error("Error saving subcategory2:", err)
      setError(`Failed to save subcategory2: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingSubcategory2(null)
    }
  }

  // Cancel subcategory2 editing
  const handleCancelSubcategory2Edit = useCallback(
    (submissionId: number) => {
      // Reset to original value
      const originalSubcategory = submissions.find((s) => s.id === submissionId)?.subcategory2 || ""
      setSubcategory2Values((prev) => ({
        ...prev,
        [submissionId]: originalSubcategory,
      }))
      setEditingSubcategory2(null)
    },
    [submissions],
  )

  // Handle exporting all questions to CSV
  const handleExportAllQuestions = async () => {
    setExportingAllQuestions(true)
    setExportError(null)

    try {
      // Fetch all questions from all submissions
      const allQuestions = await fetchAllQuestionsForExport()

      if (allQuestions.length === 0) {
        setExportError("No questions found to export")
        return
      }

      // Convert to CSV
      const csv = convertToCSV(allQuestions)

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `all_questions_export_${date}.csv`

      // Download the CSV
      downloadCSV(csv, filename)
    } catch (err) {
      console.error("Error exporting all questions:", err)
      setExportError(`Failed to export questions: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExportingAllQuestions(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2">Loading submissions...</p>
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
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700 mr-2">
                Try Again
              </Button>
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center text-purple-600 hover:text-purple-700">
            <Home className="mr-2 h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold">Review Submissions Overview</h1>
          <Badge variant="outline">{submissions.length} Total</Badge>
        </div>

        {/* Unreviewed Counter */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <FileText className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">Unreviewed Submissions</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {countsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      unreviewedCounts.unreviewedSubmissions
                    )}
                  </div>
                </div>
                <div className="h-12 w-px bg-orange-300"></div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <HelpCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">Unreviewed Questions</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {countsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      unreviewedCounts.unreviewedQuestions
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Questions are considered unreviewed if they lack ratings, comments, and reviewer names
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export All Questions Button */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <h3 className="font-medium">Export All Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Download all questions from all submissions in a single CSV file
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportAllQuestions}
                disabled={exportingAllQuestions || submissions.length === 0}
                className="bg-purple-600 hover:bg-purple-700 min-w-[180px]"
              >
                {exportingAllQuestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Download All Questions
                  </>
                )}
              </Button>
            </div>
            {exportError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}
          </Card>
        </div>

        {/* Priority submissions summary */}
        {prioritySubmissions.size > 0 && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">Priority Submissions</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{prioritySubmissions.size}</div>
                    <div className="text-xs text-muted-foreground mt-1">Marked as high priority for review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              <AlertDialogTitle>Are you sure you want to delete this entire submission?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the submission and all its questions from the
                database.
                {submissionToDelete && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <strong>Submission:</strong> {submissions.find((s) => s.id === submissionToDelete)?.topic} by{" "}
                    {submissions.find((s) => s.id === submissionToDelete)?.username}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSubmission}
                className="bg-red-600 hover:bg-red-700"
                disabled={!reviewerName.trim()}
              >
                Delete Submission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Submissions Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">All Submissions</CardTitle>
            <CardDescription>Click on any submission to review its questions in detail</CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Submissions</AlertTitle>
                <AlertDescription>No submissions are available for review.</AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[70vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-[25%]">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" /> Title & Username
                          </div>
                        </TableHead>
                        <TableHead className="w-[140px] text-center">Actions</TableHead>
                        <TableHead className="w-[80px] text-center">Questions</TableHead>
                        <TableHead className="w-[80px] text-center">Unrated</TableHead>
                        <TableHead className="w-[20%]">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" /> Overall Comment
                          </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" /> Main Category
                          </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" /> Subcategory 1
                          </div>
                        </TableHead>
                        <TableHead className="w-[15%]">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" /> Subcategory 2
                          </div>
                        </TableHead>
                        <TableHead className="w-[120px]">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Date & Time
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow
                          key={submission.id}
                          className={`hover:bg-gray-50 ${prioritySubmissions.has(submission.id) ? "bg-yellow-50 border-l-4 border-l-yellow-400" : ""}`}
                        >
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <div className="font-medium">{submission.topic}</div>
                              <div className="text-sm text-muted-foreground">by {submission.username}</div>
                              {submission.submitterLocation && submission.submitterLocation !== "Unknown" && (
                                <div className="text-xs text-muted-foreground">📍 {submission.submitterLocation}</div>
                              )}
                              <div className="flex items-center mt-1">
                                <Checkbox
                                  checked={prioritySubmissions.has(submission.id)}
                                  onCheckedChange={() => handlePriorityToggle(submission.id)}
                                  className="mr-2"
                                />
                                <span className="text-xs text-muted-foreground">Priority</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <div className="flex space-x-2 justify-center">
                              <Link href={`/admin/review-data/${submission.id}`}>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSubmission(submission.id)}
                                disabled={deletingSubmission === submission.id || !reviewerName.trim()}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deletingSubmission === submission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <Badge variant="outline" className="bg-blue-50">
                              {submission.totalQuestions}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <Badge
                              variant={submission.unratedQuestions > 0 ? "destructive" : "default"}
                              className={submission.unratedQuestions === 0 ? "bg-purple-50 text-purple-700" : ""}
                            >
                              {submission.unratedQuestions}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            {editingComment === submission.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={commentValues[submission.id] || ""}
                                  onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                                  placeholder="Add overall comment about this submission..."
                                  className="min-h-[60px]"
                                  disabled={!reviewerName.trim()}
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveComment(submission.id)}
                                    disabled={savingComment === submission.id || !reviewerName.trim()}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {savingComment === submission.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelEdit(submission.id)}
                                    disabled={savingComment === submission.id}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {submission.overallComment ? (
                                  <div className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                                    {submission.overallComment}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">No overall comment</div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditComment(submission.id)}
                                  className="h-6 px-2 text-xs"
                                  disabled={!reviewerName.trim()}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {submission.overallComment ? "Edit" : "Add"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            {editingMainCategory === submission.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={mainCategoryValues[submission.id] || ""}
                                  onChange={(e) =>
                                    setMainCategoryValues((prev) => ({ ...prev, [submission.id]: e.target.value }))
                                  }
                                  placeholder="e.g., Financial, History, Science..."
                                  className="w-full"
                                  disabled={!reviewerName.trim()}
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveMainCategory(submission.id)}
                                    disabled={savingMainCategory === submission.id || !reviewerName.trim()}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {savingMainCategory === submission.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelMainCategoryEdit(submission.id)}
                                    disabled={savingMainCategory === submission.id}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {submission.mainCategory ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    {submission.mainCategory}
                                  </Badge>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">No category</div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditMainCategory(submission.id)}
                                  className="h-6 px-2 text-xs"
                                  disabled={!reviewerName.trim()}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {submission.mainCategory ? "Edit" : "Add"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          {/* Subcategory 1 Cell */}
                          <TableCell className="align-top">
                            {editingSubcategory1 === submission.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={subcategory1Values[submission.id] || ""}
                                  onChange={(e) =>
                                    setSubcategory1Values((prev) => ({ ...prev, [submission.id]: e.target.value }))
                                  }
                                  placeholder="e.g., Banking, Ancient, Physics..."
                                  className="w-full"
                                  disabled={!reviewerName.trim()}
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveSubcategory1(submission.id)}
                                    disabled={savingSubcategory1 === submission.id || !reviewerName.trim()}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {savingSubcategory1 === submission.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelSubcategory1Edit(submission.id)}
                                    disabled={savingSubcategory1 === submission.id}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {submission.subcategory1 ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {submission.subcategory1}
                                  </Badge>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">No subcategory</div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditSubcategory1(submission.id)}
                                  className="h-6 px-2 text-xs"
                                  disabled={!reviewerName.trim()}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {submission.subcategory1 ? "Edit" : "Add"}
                                </Button>
                              </div>
                            )}
                          </TableCell>

                          {/* Subcategory 2 Cell */}
                          <TableCell className="align-top">
                            {editingSubcategory2 === submission.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={subcategory2Values[submission.id] || ""}
                                  onChange={(e) =>
                                    setSubcategory2Values((prev) => ({ ...prev, [submission.id]: e.target.value }))
                                  }
                                  placeholder="e.g., Loans, Medieval, Chemistry..."
                                  className="w-full"
                                  disabled={!reviewerName.trim()}
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveSubcategory2(submission.id)}
                                    disabled={savingSubcategory2 === submission.id || !reviewerName.trim()}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    {savingSubcategory2 === submission.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelSubcategory2Edit(submission.id)}
                                    disabled={savingSubcategory2 === submission.id}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {submission.subcategory2 ? (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                    {submission.subcategory2}
                                  </Badge>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">No subcategory</div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditSubcategory2(submission.id)}
                                  className="h-6 px-2 text-xs"
                                  disabled={!reviewerName.trim()}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {submission.subcategory2 ? "Edit" : "Add"}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-sm">{new Date(submission.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(submission.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
