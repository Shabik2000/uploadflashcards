"use server"

import { createClient } from "@/utils/supabase/server"
import { v4 as uuidv4 } from "uuid"

// Fetch a set of questions from the database
export async function fetchQuestions(page: number) {
  const supabase = createClient()

  // Fetch one record at a time for simplicity
  const { data, error } = await supabase
    .from("user_submitted_data")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page, page)
    .single()

  if (error) {
    console.error("Error fetching questions:", error)
    return null
  }

  if (!data) {
    return null
  }

  // Process the data to add IDs to questions if they don't exist
  const questions = data.data.map((item: any) => {
    // If the question doesn't have an id, add one
    if (!item.id) {
      item.id = uuidv4()
    }
    return item
  })

  return {
    id: data.id,
    username: data.username,
    topic: data.topic,
    description: data.description || "",
    questions: questions.slice(0, 20), // Limit to 20 questions
  }
}

// Submit ratings for a set of questions
export async function submitRatings(setId: number, ratings: Record<string, number>) {
  const supabase = createClient()

  // First, fetch the current data
  const { data, error } = await supabase.from("user_submitted_data").select("data").eq("id", setId).single()

  if (error) {
    console.error("Error fetching data for update:", error)
    throw new Error("Failed to fetch data for update")
  }

  // Update the ratings in the data
  const updatedData = data.data.map((item: any) => {
    if (item.id && ratings[item.id]) {
      return {
        ...item,
        rating: ratings[item.id],
      }
    }
    return item
  })

  // Update the record with the new data
  const { error: updateError } = await supabase
    .from("user_submitted_data")
    .update({ data: updatedData })
    .eq("id", setId)

  if (updateError) {
    console.error("Error updating ratings:", updateError)
    throw new Error("Failed to update ratings")
  }

  return { success: true }
}
