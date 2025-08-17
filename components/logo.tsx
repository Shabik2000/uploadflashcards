import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = "h-8 w-8", showText = true }: LogoProps) {
  return (
    <Link href="/" className="flex items-center space-x-3">
      <div className="relative">
        <Image
          src="/images/memory-nest-logo.png"
          alt="Memory Nest Logo"
          width={120}
          height={120}
          className={`${className} object-contain`}
          priority
        />
      </div>
      {showText && <span className="font-bold text-xl text-gray-900 hidden sm:block">Memory Nest</span>}
    </Link>
  )
}
