"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { submitRequestSet } from "../actions"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Logo } from "@/components/logo"

export default function RequestSetsPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const searchParams = useSearchParams()

  // Reset form when timestamp changes (new visit)
  useEffect(() => {
    if (formRef.current) {
      formRef.current.reset()
    }
  }, [searchParams.get("t")])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Logo className="h-12 w-12" showText={false} />
          </div>
          <CardTitle className="text-center text-2xl">Request Topics</CardTitle>
          <CardDescription className="text-center">
            We want to produce study sets that you want to study. Please make a suggestion on what type of topics that
            you would like us to prepare and we will send you an email once we have something ready!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={submitRequestSet} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                What is your username on Memory Nest? We will use it to pair it to your account
              </Label>
              <Input id="name" name="name" placeholder="Your username" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Your email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <small className="text-muted-foreground italic block">
                Example: Philosophers from the 20th century or ACCA first module
              </small>
              <Input id="topic" name="topic" placeholder="Suggested topic" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <p className="text-sm text-muted-foreground">
                Please elaborate a bit more so we know what things you find difficult or any other requests. If you are
                using abbreviations that may not be obvious, please give us a bit more information. For example, in this
                case ACCA is referring to "Association of Chartered Certified Accountants".
              </p>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what you'd like to learn about this topic"
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox id="subscribe" name="subscribe" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="subscribe" className="text-sm font-normal">
                  Do you want to subscribe to our newsletter? We will keep it at maximum 1 per month and you can
                  unsubscribe at any time.
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Submit Request
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
