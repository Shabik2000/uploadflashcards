"use server"

// Function to get the country from an IP address with better error handling
export async function getCountryFromIP(ip: string): Promise<string> {
  try {
    // Skip external API calls for localhost or development IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "Development"
    }

    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        next: { revalidate: 86400 }, // Cache for 24 hours
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`IP geolocation service returned status: ${response.status}`)
        return "Unknown"
      }

      const data = await response.json()
      return data.country_name || "Unknown"
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.warn("IP geolocation fetch failed:", fetchError.message)
      return "Unknown"
    }
  } catch (error) {
    console.warn("Error in getCountryFromIP:", error)
    return "Unknown"
  }
}

// Function to get the client IP address from the request
export async function getClientIP(request: Request): Promise<string> {
  try {
    // Try to get the IP from various headers
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")

    // Use the first IP from x-forwarded-for, or x-real-ip, or a fallback
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIP ? realIP : "127.0.0.1"

    return ip
  } catch (error) {
    console.warn("Error getting client IP:", error)
    return "127.0.0.1"
  }
}

// Combined function to get country from request with fallback
export async function getCountryFromRequest(request: Request): Promise<string> {
  try {
    if (!request) return "Unknown"

    const ip = await getClientIP(request)
    return await getCountryFromIP(ip)
  } catch (error) {
    console.warn("Error in getCountryFromRequest:", error)
    return "Unknown"
  }
}

// Mock function for development/preview environments
export async function getMockCountry(): Promise<string> {
  const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Brazil"]
  return countries[Math.floor(Math.random() * countries.length)]
}
