"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchNewsletterSubscribers, deleteSubscriber } from "./actions"
import { Loader2, Home, Mail, Calendar, Trash2, Download, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

interface NewsletterSubscriber {
  id: number
  email: string
  subscribed_at: string
}

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null)

  // Fetch subscribers on component mount
  useEffect(() => {
    const loadSubscribers = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchNewsletterSubscribers()
        setSubscribers(data)
      } catch (err) {
        console.error("Error loading subscribers:", err)
        setError("Failed to load newsletter subscribers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadSubscribers()
  }, [])

  // Handle delete subscriber
  const handleDeleteSubscriber = (email: string) => {
    setEmailToDelete(email)
    setShowDeleteDialog(true)
  }

  // Close delete dialog
  const closeDeleteDialog = () => {
    setShowDeleteDialog(false)
    setEmailToDelete(null)
  }

  // Confirm delete subscriber
  const confirmDeleteSubscriber = async () => {
    if (!emailToDelete) {
      closeDeleteDialog()
      return
    }

    setDeletingEmail(emailToDelete)
    setError(null)

    try {
      await deleteSubscriber(emailToDelete)

      // Remove from local state
      setSubscribers((prev) => prev.filter((sub) => sub.email !== emailToDelete))
    } catch (err) {
      console.error("Error deleting subscriber:", err)
      setError(`Failed to delete subscriber: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeletingEmail(null)
      closeDeleteDialog()
    }
  }

  // Handle export to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) return

    // Prepare data for CSV export
    const csvData = subscribers.map((subscriber, index) => ({
      Number: index + 1,
      Email: subscriber.email,
      SubscribedDate: new Date(subscriber.subscribed_at).toLocaleDateString(),
      SubscribedTime: new Date(subscriber.subscribed_at).toLocaleTimeString(),
      SubscribedDateTime: new Date(subscriber.subscribed_at).toLocaleString(),
    }))

    // Convert to CSV
    const csv = convertToCSV(csvData)

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0]
    const filename = `newsletter_subscribers_${date}.csv`

    // Download the CSV
    downloadCSV(csv, filename)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2">Loading newsletter subscribers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center text-purple-600 hover:text-purple-700">
            <Home className="mr-2 h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
          <Badge variant="outline" className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {subscribers.length} Total
          </Badge>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this subscriber?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the email address from the newsletter
                subscription list.
                {emailToDelete && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <strong>Email:</strong> {emailToDelete}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSubscriber} className="bg-red-600 hover:bg-red-700">
                Delete Subscriber
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export and Stats */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <h3 className="font-medium">Newsletter Subscribers</h3>
                  <p className="text-sm text-muted-foreground">Manage and export your newsletter subscriber list</p>
                </div>
              </div>
              <Button
                onClick={handleExportCSV}
                disabled={subscribers.length === 0}
                className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Subscribers Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              All Newsletter Subscribers
            </CardTitle>
            <CardDescription>List of all users who have subscribed to the newsletter</CardDescription>
          </CardHeader>
          <CardContent>
            {subscribers.length === 0 ? (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>No Subscribers</AlertTitle>
                <AlertDescription>No newsletter subscribers found.</AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[70vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead className="w-[40%]">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" /> Email Address
                          </div>
                        </TableHead>
                        <TableHead className="w-[30%]">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Subscribed Date
                          </div>
                        </TableHead>
                        <TableHead className="w-[20%]">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" /> Time
                          </div>
                        </TableHead>
                        <TableHead className="w-[10%] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber, index) => (
                        <TableRow key={subscriber.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{subscriber.email}</TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(subscriber.subscribed_at).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(subscriber.subscribed_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSubscriber(subscriber.email)}
                              disabled={deletingEmail === subscriber.email}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingEmail === subscriber.email ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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
