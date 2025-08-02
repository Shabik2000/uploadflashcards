import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import Link from "next/link"

export default function NewsletterSignup() {
  // Generate a timestamp to prevent caching
  const timestamp = Date.now()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader className="flex flex-col items-center space-y-2 pt-6">
          <Logo className="h-12 w-12" />
          <h1 className="text-center text-2xl font-bold">MemoryNest - Connect, Request and Share</h1>
          <p className="text-center text-sm text-muted-foreground">
            MemoryNest is a constant work in progress and we need you as a user to keep evolving. Please select one of
            the options below. Please help us by requesting study topics that you are interested in OR submit your own
            questions and answers available for study. You are also very welcome to subscribe to our newsletter, we will
            never send more than one email per month to not clog your inbox.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input type="email" placeholder="Enter your email" className="pr-10" />
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">Subscribe Now</Button>
            <div className="mt-2 space-y-2">
              <Link href={`/submit-data?t=${timestamp}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Upload Your Own Flashcards
                </Button>
              </Link>
              <Link href={`/request-sets?t=${timestamp}`} className="w-full">
                <Button variant="outline" className="w-full">
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
