import { Button } from "@/components/ui/button"
import { Facebook, Twitter } from "lucide-react"

export function SocialSignup() {
  return (
    <div className="flex flex-col space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="w-full">
          <Twitter className="mr-2 h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:text-xs">X</span>
        </Button>
        <Button variant="outline" className="w-full">
          <Facebook className="mr-2 h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:text-xs">Facebook</span>
        </Button>
      </div>
    </div>
  )
}
