"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { testGoogleSheetsConnection } from "../../submit-data-sheets/test-connection"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

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
          <CardTitle className="text-center text-xl">Google Sheets Connection Test</CardTitle>
          <CardDescription className="text-center">
            Test your Google Sheets API connection to diagnose any issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Error:</span> {result.error}
                  </p>
                  {result.details && (
                    <div className="space-y-1">
                      <p className="font-medium">Environment Variables:</p>
                      <ul className="list-disc pl-5">
                        <li>
                          Client Email:{" "}
                          {result.details.hasClientEmail ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </li>
                        <li>
                          Private Key:{" "}
                          {result.details.hasPrivateKey ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </li>
                        <li>
                          Spreadsheet ID:{" "}
                          {result.details.hasSpreadsheetId ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </li>
                      </ul>
                    </div>
                  )}
                  {result.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground">Show Error Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-auto max-h-[200px]">
                        {result.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-center text-muted-foreground">
            Make sure your service account has edit access to the spreadsheet
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
