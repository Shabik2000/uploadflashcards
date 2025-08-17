"use server"

import { createClient } from "@/utils/supabase/server"

export async function fetchNewsletterSubscribers() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("Error fetching newsletter subscribers:", error)
      throw new Error(`Failed to fetch subscribers: ${error.message}`)
    }

    return data || []
  } catch (err) {
    console.error("Error in fetchNewsletterSubscribers:", err)
    throw new Error(`Failed to fetch subscribers: ${err.message}`)
  }
}

export async function deleteSubscriber(email: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("newsletter_subscriptions").delete().eq("email", email)

    if (error) {
      console.error("Error deleting subscriber:", error)
      throw new Error(`Failed to delete subscriber: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Error in deleteSubscriber:", err)
    throw new Error(`Failed to delete subscriber: ${err.message}`)
  }
}
