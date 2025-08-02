"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function submitRequestSet(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const topic = formData.get("topic") as string
  const description = formData.get("description") as string
  const subscribe = formData.get("subscribe") === "on"

  // Validate form data
  if (!name || !email || !topic) {
    return {
      error: "Name, email, and topic are required fields",
    }
  }

  // Create Supabase client
  const supabase = createClient()

  // Insert data into the request_sets table
  const { error } = await supabase.from("request_sets").insert([
    {
      name,
      email,
      topic,
      description,
      subscribe_to_newsletter: subscribe,
    },
  ])

  if (error) {
    return {
      error: error.message,
    }
  }

  // Revalidate the path and redirect with timestamp to prevent caching
  revalidatePath("/request-sets")
  const timestamp = Date.now()
  redirect(`/request-sets/success?t=${timestamp}`)
}
