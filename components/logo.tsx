import { CircleUser } from "lucide-react"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-green-600 p-2 text-white ${className}`}>
      <CircleUser className="h-6 w-6" />
    </div>
  )
}
