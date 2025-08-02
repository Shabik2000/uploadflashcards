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
          <CardTitle className="text-center text-2xl">Data Submitted Successfully!</CardTitle>
          <CardDescription className="text-center">
            Thank you for contributing your knowledge. Your data has been received and will be reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We appreciate your contribution to our community learning resources. Your questions and answers will help
            others in their studies.
          </p>
          <a href={`/submit-data?t=${timestamp}`} className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">Submit More Data</Button>
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
