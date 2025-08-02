import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SuccessPage() {
  // Generate a timestamp to prevent caching
  const timestamp = Date.now()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader className="flex flex-col items-center space-y-2 pt-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-center text-2xl">Request Submitted!</CardTitle>
          <CardDescription className="text-center">
            Thank you for your topic suggestion. We'll review it and consider it for future newsletters.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We appreciate your input and are constantly working to improve our content based on subscriber feedback.
          </p>
          <a href={`/request-sets?t=${timestamp}`}>
            <Button className="bg-green-600 hover:bg-green-700">Submit Another Request</Button>
          </a>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
