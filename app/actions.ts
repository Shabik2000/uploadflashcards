"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitRequestSet(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const topic = formData.get("topic") as string
    const description = formData.get("description") as string
    const subscribe = formData.get("subscribe") === "on"

    if (!name || !email || !topic || !description) {
      throw new Error("All fields are required")
    }

    const supabase = await createClient()

    const { error: requestError } = await supabase.from("topic_requests").insert([
      {
        name,
        email,
        topic,
        description,
        created_at: new Date().toISOString(),
      },
    ])

    if (requestError) {
      console.error("Request submission error:", requestError)
      throw new Error("Failed to submit request")
    }

    if (subscribe) {
      const { error: subscribeError } = await supabase.from("newsletter_subscriptions").insert([{ email }]).select()

      if (subscribeError && !subscribeError.message.includes("duplicate")) {
        console.error("Newsletter subscription error:", subscribeError)
      }
    }

    revalidatePath("/request-sets")

    return { success: true, redirectTo: `/request-sets/success?t=${Date.now()}` }
  } catch (error) {
    console.error("Submit request error:", error)
    return { success: false, error: error.message || "Failed to submit request" }
  }
}

export async function subscribeToNewsletter(formData: FormData) {
  try {
    const email = formData.get("email") as string

    if (!email || !email.includes("@")) {
      return {
        success: false,
        error: "Please enter a valid email address",
        message: "",
      }
    }

    const supabase = await createClient()

    try {
      const { error: tableError } = await supabase.rpc("create_newsletter_table_if_not_exists")
      if (tableError) {
        console.log("Table creation function not found, table might already exist")
      }
    } catch (error) {
      console.log("Table creation attempt failed, continuing...")
    }

    const { data: existingSubscription, error: checkError } = await supabase
      .from("newsletter_subscriptions")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Database check error:", checkError)
      return {
        success: false,
        error: "Database connection error. Please try again later.",
        message: "",
      }
    }

    if (existingSubscription) {
      return {
        success: false,
        error: "This email is already subscribed to our newsletter.",
        message: "",
      }
    }

    const { error: insertError } = await supabase.from("newsletter_subscriptions").insert([{ email }])

    if (insertError) {
      console.error("Database insert error:", insertError)
      return {
        success: false,
        error: "Failed to subscribe. Please try again later.",
        message: "",
      }
    }

    revalidatePath("/")

    return {
      success: true,
      message: "Thank you for subscribing! We'll keep you updated with our latest flashcard sets.",
      error: "",
    }
  } catch (error) {
    console.error("Subscription error:", error)
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      message: "",
    }
  }
}
