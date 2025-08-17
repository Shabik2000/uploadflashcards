"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchQuestions, submitRatings } from "./actions"
import { Star, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Question {
  id: string
  question: string
  answer: string
  readMore?: string
  rating?: number
}

interface QuestionSet {
  id: number
  username: string
  topic: string
  description: string
  questions: Question[]
}

export default function RateQuestionsPage() {
  const [currentSet, setCurrentSet] = useState<QuestionSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [allRated, setAllRated] = useState(false)

  // Fetch questions on page load and when page changes
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      try {
        const data = await fetchQuestions(page)
        if (data) {
          setCurrentSet(data)
          // Initialize ratings object
          const initialRatings: Record<string, number> = {}
          data.questions.forEach((q) => {
            initialRatings[q.id] = q.rating || 0
          })
          setRatings(initialRatings)
        }
      } catch (error) {
        console.error("Error loading questions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [page])

  // Check if all questions have been rated
  useEffect(() => {
    if (!currentSet) return

    const allQuestionsRated = currentSet.questions.every((q) => ratings[q.id] > 0)
    setAllRated(allQuestionsRated)
  }, [ratings, currentSet])

  // Handle rating a question
  const handleRate = (questionId: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [questionId]: rating,
    }))
  }

  // Handle rating all questions at once
  const handleRateAll = (rating: number) => {
    if (!currentSet) return

    const newRatings: Record<string, number> = {}
    currentSet.questions.forEach((q) => {
      newRatings[q.id] = rating
    })
    setRatings(newRatings)
  }

  // Handle submitting all ratings
  const handleSubmit = async () => {
    if (!currentSet) return

    setSubmitting(true)
    try {
      await submitRatings(currentSet.id, ratings)
      // Move to next page
      setPage((prev) => prev + 1)
      // Reset ratings
      setRatings({})
    } catch (error) {
      console.error("Error submitting ratings:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (!currentSet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="mx-auto w-full max-w-3xl shadow-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">No More Questions</CardTitle>
            <CardDescription className="text-center">
              You've rated all available question sets. Check back later for more.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setPage(0)} className="bg-blue-600 hover:bg-blue-700">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Rating Set: {currentSet.topic}{" "}
                <span className="text-sm text-muted-foreground">by {currentSet.username}</span>
              </CardTitle>
              <Badge variant="outline" className="ml-2">
                Page {page + 1}
              </Badge>
            </div>
            <CardDescription>{currentSet.description}</CardDescription>

            {/* Rate All Questions Section */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Rate All Questions:</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateAll(star)}
                      className="px-3 py-1 h-8"
                    >
                      <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" />
                      <span>{star}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {currentSet.questions.map((question, index) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-[1fr,auto] gap-4">
                      <div className="space-y-2">
                        <p className="font-medium">
                          <span className="text-muted-foreground mr-2">{index + 1}.</span>
                          {question.question}
                        </p>
                        <p className="text-sm text-muted-foreground">{question.answer}</p>
                        {question.readMore && (
                          <p className="text-xs text-muted-foreground italic">{question.readMore}</p>
                        )}
                      </div>
                      <div className="flex items-start space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant="ghost"
                            size="sm"
                            className={`p-1 ${ratings[question.id] >= star ? "text-yellow-500" : "text-gray-300"}`}
                            onClick={() => handleRate(question.id, star)}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {currentSet.questions.length} questions • {Object.values(ratings).filter((r) => r > 0).length} rated
            </div>
            <Button onClick={handleSubmit} disabled={!allRated || submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                </>
              ) : (
                "Submit Ratings & Continue"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
