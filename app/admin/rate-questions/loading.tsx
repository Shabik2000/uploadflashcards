import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
        <p className="mt-2">Loading questions...</p>
      </div>
    </div>
  )
}
