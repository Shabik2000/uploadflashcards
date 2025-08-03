"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { getCountryFromRequest, getMockCountry } from "@/utils/ip-location"

export async function submitUserData(formData: FormData, request?: Request) {
  const username = formData.get("username") as string
  const topic = formData.get("topic") as string
  const description = formData.get("description") as string
  const rawData = formData.get("data") as string
  const userProvidedLocation = (formData.get("location") as string) || ""

  // Get the user's country with fallback to mock data if real geolocation fails
  let country = userProvidedLocation || "Unknown"

  // Only try to get location from IP if user didn't provide one
  if (!userProvidedLocation) {
    try {
      if (request) {
        country = await getCountryFromRequest(request)
        // If geolocation failed, use mock data in development/preview
        if (country === "Unknown" && process.env.NODE_ENV !== "production") {
          country = (await getMockCountry()) + " (Mock)"
        }
      } else if (process.env.NODE_ENV !== "production") {
        // In development/preview without request, use mock data
        country = (await getMockCountry()) + " (Mock)"
      }
    } catch (error) {
      console.warn("Error getting user country, using fallback:", error)
      // Use mock data in development/preview
      if (process.env.NODE_ENV !== "production") {
        country = (await getMockCountry()) + " (Mock)"
      }
    }
  }

  // Validate form data
  if (!username || !topic || !description || !rawData) {
    return {
      error: "All fields are required",
      success: false,
    }
  }

  // Validate field lengths - increased max title length to 38
  if (topic.length < 10 || topic.length > 38) {
    return {
      error: "Study set name must be between 10 and 38 characters",
      success: false,
    }
  }

  if (description.length < 25 || description.length > 110) {
    return {
      error: "Description must be between 25 and 110 characters",
      success: false,
    }
  }

  // Process the pasted data
  const rows = processExcelData(rawData)

  // Validate that we have at least 20 rows
  if (rows.length < 20) {
    return {
      error: "Minimum 20 questions and answers required",
      success: false,
      rowCount: rows.length,
    }
  }

  // Add location and submission metadata to the data array
  const dataWithMetadata = {
    questions: rows,
    submitterLocation: country,
    submittedAt: new Date().toISOString(),
  }

  // Create Supabase client
  const supabase = createClient()

  // Insert data into the user_submitted_data table
  const { error } = await supabase.from("user_submitted_data").insert([
    {
      username,
      topic,
      description,
      data: dataWithMetadata, // Store location within the data field
    },
  ])

  if (error) {
    return {
      error: error.message,
      success: false,
    }
  }

  // Revalidate the path
  revalidatePath("/submit-data")

  // Return success instead of redirecting
  return {
    success: true,
    redirectTo: `/submit-data/success?t=${Date.now()}`,
  }
}

// Helper function to process Excel/Google Sheets data
function processExcelData(data: string) {
  // Split by newlines to get rows
  const rows = data.trim().split(/\r?\n/)

  return rows
    .map((row) => {
      // Split by tabs (Excel/Google Sheets use tabs when copying)
      const columns = row.split("\t")

      return {
        question: columns[0] || "",
        answer: columns[1] || "",
        readMore: columns[2] || "",
      }
    })
    .filter((row) => row.question && row.answer) // Only keep rows with both question and answer
}
