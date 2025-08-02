"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { testGoogleSheetsConnection } from "../submit-data-sheets/test-connection"
import { Loader2, CheckCircle, XCircle, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TestSheetsConnectionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runTest = async () => {
    setLoading(true)
    try {
      const testResult = await testGoogleSheetsConnection()
      setResult(testResult)
    } catch (error) {
      setResult({
        success: false,
        error: error.message || "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="mx-auto w-full max-w-md shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/" className="text-green-600 hover:text-green-700 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
            </Link>
          </div>
          <CardTitle className="text-center text-xl mt-4">Google Sheets Connection Test</CardTitle>
          <CardDescription className="text-center">
            Test your Google Sheets API connection to diagnose any issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              This is running in demo mode with simulated responses. In a production environment, you would connect to
              the actual Google Sheets API.
            </AlertDescription>
          </Alert>

          <Button onClick={runTest} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing Connection...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          {result && (
            <div className="mt-4 border rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Status:</span>
                {result.success ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Connected
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Failed
                  </span>
                )}
              </div>

              {result.success ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Spreadsheet Title:</span> {result.spreadsheetTitle}
                  </p>
                  <p>
                    <span className="font-medium">Number of Sheets:</span> {result.sheetsCount}
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2 text-green-800">
                    {result.message}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Error:</span> {result.error}
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 text-red-800">
                    {result.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-center text-muted-foreground">
            This is a simulated connection for demonstration purposes
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
