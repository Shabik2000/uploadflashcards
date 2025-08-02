"use server"

import { createClient } from "@/utils/supabase/server"
import { v4 as uuidv4 } from "uuid"

// Fetch all submissions for the overview page
export async function fetchAllSubmissions() {
  const supabase = createClient()

  try {
    // Fetch all data sets
    const { data, error } = await supabase
      .from("user_submitted_data")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      throw new Error(`Failed to fetch submissions: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Process each submission to get overview data
    return data.map((dataSet) => {
      // Handle different data structures for backward compatibility
      let questions = []
      let submitterLocation = "Unknown"
      let overallComment = ""
      let mainCategory = ""
      let subcategory1 = ""
      let subcategory2 = ""

      if (dataSet.data) {
        if (Array.isArray(dataSet.data)) {
          // Old format: data is directly an array of questions
          questions = dataSet.data
        } else if (dataSet.data.questions) {
          // New format: data is an object with questions and metadata
          questions = dataSet.data.questions || []
          submitterLocation = dataSet.data.submitterLocation || "Unknown"
          overallComment = dataSet.data.overallComment || ""
          mainCategory = dataSet.data.mainCategory || ""
          subcategory1 = dataSet.data.subcategory1 || ""
          subcategory2 = dataSet.data.subcategory2 || ""
        }
      }

      // Count unrated questions
      const unratedQuestions = questions.filter((q: any) => !q.rating || q.rating === 0).length

      return {
        id: dataSet.id,
        username: dataSet.username,
        topic: dataSet.topic,
        description: dataSet.description || "",
        totalQuestions: questions.length,
        unratedQuestions,
        created_at: dataSet.created_at,
        submitterLocation,
        overallComment,
        mainCategory,
        subcategory1,
        subcategory2,
      }
    })
  } catch (err) {
    console.error("Error in fetchAllSubmissions:", err)
    throw new Error(`Failed to fetch submissions: ${err.message}`)
  }
}

// Fetch a specific submission by ID
export async function fetchSubmissionById(submissionId: number) {
  const supabase = createClient()

  try {
    // Fetch the specific submission
    const { data, error } = await supabase.from("user_submitted_data").select("*").eq("id", submissionId).single()

    if (error) {
      console.error("Error fetching submission:", error)
      return null
    }

    if (!data) {
      return null
    }

    // Handle different data structures for backward compatibility
    let questions = []
    let submitterLocation = "Unknown"
    let overallComment = ""
    let mainCategory = ""
    let subcategory1 = ""
    let subcategory2 = ""

    if (data.data) {
      if (Array.isArray(data.data)) {
        // Old format: data is directly an array of questions
        questions = data.data
        mainCategory = data.data.mainCategory || ""
        subcategory1 = data.data.subcategory1 || ""
        subcategory2 = data.data.subcategory2 || ""
      } else if (data.data.questions) {
        // New format: data is an object with questions and metadata
        questions = data.data.questions || []
        submitterLocation = data.data.submitterLocation || "Unknown"
        overallComment = data.data.overallComment || ""
        mainCategory = data.data.mainCategory || ""
        subcategory1 = data.data.subcategory1 || ""
        subcategory2 = data.data.subcategory2 || ""
      }
    }

    // Process the questions to add IDs if they don't exist
    const processedQuestions = questions.map((item: any) => {
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
      questions: processedQuestions,
      totalQuestions: processedQuestions.length,
      created_at: data.created_at,
      submitterLocation,
      overallComment,
      mainCategory,
      subcategory1,
      subcategory2,
    }
  } catch (err) {
    console.error("Error in fetchSubmissionById:", err)
    return null
  }
}

// Save overall comment for a submission
export async function saveSubmissionComment(submissionId: number, comment: string, reviewerName: string) {
  const supabase = createClient()

  try {
    // First, fetch the current data to preserve existing structure
    const { data: currentData, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("data")
      .eq("id", submissionId)
      .single()

    if (fetchError) {
      console.error("Error fetching current data:", fetchError)
      throw new Error(`Failed to fetch current data: ${fetchError.message}`)
    }

    // Preserve the existing data structure and add/update the overall comment
    let updatedData
    if (Array.isArray(currentData.data)) {
      // Old format: convert to new format with metadata
      updatedData = {
        questions: currentData.data,
        overallComment: comment,
        overallCommentBy: reviewerName,
        overallCommentTimestamp: new Date().toISOString(),
      }
    } else {
      // New format: preserve existing structure and update comment
      updatedData = {
        ...currentData.data,
        overallComment: comment,
        overallCommentBy: reviewerName,
        overallCommentTimestamp: new Date().toISOString(),
      }
    }

    // Update the record with the new data
    const { error } = await supabase.from("user_submitted_data").update({ data: updatedData }).eq("id", submissionId)

    if (error) {
      console.error("Error updating submission comment:", error)
      throw new Error(`Failed to update submission comment: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Exception in saveSubmissionComment:", err)
    throw new Error(`Failed to save submission comment: ${err.message}`)
  }
}

// Fetch submitted data from the database (legacy function for backward compatibility)
export async function fetchSubmittedData(page = 0) {
  const supabase = createClient()

  // Calculate pagination limits
  const pageSize = 1 // We'll still fetch one set at a time
  const from = page * pageSize
  const to = from + pageSize - 1

  // Fetch data without using .single()
  const { data, error } = await supabase
    .from("user_submitted_data")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Error fetching data:", error)
    return null
  }

  // Check if we have any data
  if (!data || data.length === 0) {
    return null
  }

  // Get the first item (we're still processing one set at a time)
  const dataSet = data[0]

  // Handle different data structures for backward compatibility
  let questions = []
  let submitterLocation = "Unknown"
  let mainCategory = ""
  let subcategory1 = ""
  let subcategory2 = ""

  if (dataSet.data) {
    if (Array.isArray(dataSet.data)) {
      // Old format: data is directly an array of questions
      questions = dataSet.data
    } else if (dataSet.data.questions) {
      // New format: data is an object with questions and metadata
      questions = dataSet.data.questions || []
      submitterLocation = dataSet.data.submitterLocation || "Unknown"
      mainCategory = dataSet.data.mainCategory || ""
      subcategory1 = dataSet.data.subcategory1 || ""
      subcategory2 = dataSet.data.subcategory2 || ""
    }
  }

  // Process the questions to add IDs if they don't exist
  const processedQuestions = questions.map((item: any) => {
    // If the question doesn't have an id, add one
    if (!item.id) {
      item.id = uuidv4()
    }
    return item
  })

  return {
    id: dataSet.id,
    username: dataSet.username,
    topic: dataSet.topic,
    description: dataSet.description || "",
    questions: processedQuestions,
    totalQuestions: processedQuestions.length,
    created_at: dataSet.created_at,
    submitterLocation,
    mainCategory,
    subcategory1,
    subcategory2,
  }
}

// Fetch counts of unreviewed submissions and questions
export async function fetchUnreviewedCounts() {
  const supabase = createClient()

  try {
    // Fetch all data sets
    const { data, error } = await supabase
      .from("user_submitted_data")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching data for counts:", error)
      return { unreviewedSubmissions: 0, unreviewedQuestions: 0 }
    }

    if (!data || data.length === 0) {
      return { unreviewedSubmissions: 0, unreviewedQuestions: 0 }
    }

    let unreviewedSubmissions = 0
    let unreviewedQuestions = 0

    // Process each data set
    for (const dataSet of data) {
      let questions = []
      let mainCategory = ""
      let subcategory1 = ""
      let subcategory2 = ""

      // Handle different data structures for backward compatibility
      if (dataSet.data) {
        if (Array.isArray(dataSet.data)) {
          // Old format: data is directly an array of questions
          questions = dataSet.data
        } else if (dataSet.data.questions) {
          // New format: data is an object with questions and metadata
          questions = dataSet.data.questions || []
          mainCategory = dataSet.data.mainCategory || ""
          subcategory1 = dataSet.data.subcategory1 || ""
          subcategory2 = dataSet.data.subcategory2 || ""
        }
      }

      // Check if this submission has any unreviewed questions
      let hasUnreviewedQuestions = false

      for (const question of questions) {
        // Consider a question unreviewed if it doesn't have:
        // - A rating, AND
        // - An admin comment, AND
        // - A reviewer name
        const isUnreviewed =
          (!question.rating || question.rating === 0) &&
          (!question.adminComment || question.adminComment.trim() === "") &&
          (!question.reviewerName || question.reviewerName.trim() === "")

        if (isUnreviewed) {
          unreviewedQuestions++
          hasUnreviewedQuestions = true
        }
      }

      // If this submission has any unreviewed questions, count it as unreviewed
      if (hasUnreviewedQuestions) {
        unreviewedSubmissions++
      }
    }

    return { unreviewedSubmissions, unreviewedQuestions }
  } catch (err) {
    console.error("Error fetching unreviewed counts:", err)
    return { unreviewedSubmissions: 0, unreviewedQuestions: 0 }
  }
}

// Fetch all data sets for bulk export
export async function fetchAllDataSets() {
  const supabase = createClient()

  // Fetch all data sets
  const { data, error } = await supabase
    .from("user_submitted_data")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all data sets:", error)
    throw new Error(`Failed to fetch all data sets: ${error.message}`)
  }

  // Check if we have any data
  if (!data || data.length === 0) {
    return []
  }

  // Process each data set
  return data.map((dataSet) => {
    // Handle different data structures for backward compatibility
    let questions = []
    let submitterLocation = "Unknown"
    let mainCategory = ""
    let subcategory1 = ""
    let subcategory2 = ""

    if (dataSet.data) {
      if (Array.isArray(dataSet.data)) {
        // Old format: data is directly an array of questions
        questions = dataSet.data
      } else if (dataSet.data.questions) {
        // New format: data is an object with questions and metadata
        questions = dataSet.data.questions || []
        submitterLocation = dataSet.data.submitterLocation || "Unknown"
        mainCategory = dataSet.data.mainCategory || ""
        subcategory1 = dataSet.data.subcategory1 || ""
        subcategory2 = dataSet.data.subcategory2 || ""
      }
    }

    // Process the questions to add IDs if they don't exist
    const processedQuestions = questions.map((item: any) => {
      // If the question doesn't have an id, add one
      if (!item.id) {
        item.id = uuidv4()
      }
      return item
    })

    return {
      id: dataSet.id,
      username: dataSet.username,
      topic: dataSet.topic,
      description: dataSet.description || "",
      questions: processedQuestions,
      totalQuestions: processedQuestions.length,
      created_at: dataSet.created_at,
      submitterLocation,
      mainCategory,
      subcategory1,
      subcategory2,
    }
  })
}

// Fetch all questions from all submissions for CSV export
export async function fetchAllQuestionsForExport() {
  const supabase = createClient()

  try {
    // Fetch all data sets
    const { data, error } = await supabase
      .from("user_submitted_data")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all data for export:", error)
      throw new Error(`Failed to fetch data for export: ${error.message}`)
    }

    // Check if we have any data
    if (!data || data.length === 0) {
      return []
    }

    // Process each data set and extract all questions
    const allQuestions = []

    for (const dataSet of data) {
      // Handle different data structures for backward compatibility
      let questions = []
      let submitterLocation = "Unknown"
      let mainCategory = ""
      let subcategory1 = ""
      let subcategory2 = ""

      if (dataSet.data) {
        if (Array.isArray(dataSet.data)) {
          // Old format: data is directly an array of questions
          questions = dataSet.data
        } else if (dataSet.data.questions) {
          // New format: data is an object with questions and metadata
          questions = dataSet.data.questions || []
          submitterLocation = dataSet.data.submitterLocation || "Unknown"
          mainCategory = dataSet.data.mainCategory || ""
          subcategory1 = dataSet.data.subcategory1 || ""
          subcategory2 = dataSet.data.subcategory2 || ""
        }
      }

      // Format the submission date
      let formattedDate = "Not available"
      if (dataSet.created_at) {
        try {
          const date = new Date(dataSet.created_at)
          formattedDate = date.toISOString().split("T")[0] // YYYY-MM-DD format
        } catch (e) {
          formattedDate = dataSet.created_at
        }
      }

      // Add each question to the allQuestions array with submission metadata
      questions.forEach((question, index) => {
        allQuestions.push({
          SubmissionID: dataSet.id,
          SubmissionTitle: dataSet.topic,
          Username: dataSet.username,
          SubmissionDate: formattedDate,
          Location: submitterLocation,
          MainCategory: question.mainCategory || mainCategory || "",
          Subcategory1: question.subcategory1 || subcategory1 || "",
          Subcategory2: question.subcategory2 || subcategory2 || "",
          QuestionNumber: index + 1,
          Question: question.question || "",
          Answer: question.answer || "",
          ReadMore: question.readMore || "",
          Rating: question.rating || "",
          AdminComment: question.adminComment || "",
          ReviewerName: question.reviewerName || "",
          ReviewTimestamp: question.reviewTimestamp ? new Date(question.reviewTimestamp).toLocaleString() : "",
        })
      })
    }

    return allQuestions
  } catch (err) {
    console.error("Error in fetchAllQuestionsForExport:", err)
    throw new Error(`Failed to export questions: ${err.message}`)
  }
}

// Submit ratings and edits for questions
export async function saveQuestionChanges(
  setId: number,
  updatedQuestions: Array<{
    id: string
    question: string
    answer: string
    readMore?: string
    rating?: number
    adminComment?: string
    reviewerName?: string
  }>,
  reviewerName: string,
) {
  console.log("Starting saveQuestionChanges with setId:", setId)
  console.log("Reviewer name:", reviewerName)

  const supabase = createClient()

  try {
    // First, fetch the current data to preserve metadata
    const { data: currentData, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("data")
      .eq("id", setId)
      .single()

    if (fetchError) {
      console.error("Error fetching current data:", fetchError)
      throw new Error(`Failed to fetch current data: ${fetchError.message}`)
    }

    // Add the reviewer's name to each question that has an admin comment
    const questionsWithReviewer = updatedQuestions.map((q) => {
      if (q.adminComment) {
        return {
          ...q,
          reviewerName: reviewerName || "Anonymous",
          reviewTimestamp: new Date().toISOString(),
        }
      }
      return q
    })

    // Preserve the existing data structure
    let updatedData
    if (Array.isArray(currentData.data)) {
      // Old format: just update with the questions array
      updatedData = questionsWithReviewer
    } else {
      // New format: preserve metadata and update questions
      updatedData = {
        ...currentData.data,
        questions: questionsWithReviewer,
      }
    }

    // Update the record with the new data
    const { error } = await supabase.from("user_submitted_data").update({ data: updatedData }).eq("id", setId)

    if (error) {
      console.error("Error updating data in Supabase:", error)
      throw new Error(`Failed to update data: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Exception in saveQuestionChanges:", err)
    throw new Error(`Failed to save changes: ${err.message}`)
  }
}

// Save submitter location by updating the data field
export async function saveSubmitterLocation(formData: FormData) {
  const username = formData.get("username") as string
  const location = formData.get("location") as string

  if (!username || !location) {
    return {
      success: false,
      error: "Username and location are required",
    }
  }

  const supabase = createClient()

  try {
    // First, fetch all records for this username
    const { data, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("id, data")
      .eq("username", username)

    if (fetchError) {
      console.error("Error fetching user data:", fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "No records found for this username",
      }
    }

    // Update each record with the location
    const updatePromises = data.map(async (record) => {
      let updatedData

      if (Array.isArray(record.data)) {
        // Old format: convert to new format with metadata
        updatedData = {
          questions: record.data,
          submitterLocation: location,
          locationUpdatedAt: new Date().toISOString(),
        }
      } else {
        // New format: update the location in existing structure
        updatedData = {
          ...record.data,
          submitterLocation: location,
          locationUpdatedAt: new Date().toISOString(),
        }
      }

      // Update the record
      const { error: updateError } = await supabase
        .from("user_submitted_data")
        .update({ data: updatedData })
        .eq("id", record.id)

      if (updateError) {
        throw new Error(`Failed to update record ${record.id}: ${updateError.message}`)
      }
    })

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    return { success: true }
  } catch (err) {
    console.error("Error updating submitter location:", err)
    return {
      success: false,
      error: err.message || "An error occurred while updating location",
    }
  }
}

// Delete an entire submission
export async function deleteSubmission(submissionId: number, reviewerName: string) {
  const supabase = createClient()

  try {
    console.log(`Deleting submission ${submissionId} by reviewer: ${reviewerName}`)

    // Delete the submission from the database
    const { error } = await supabase.from("user_submitted_data").delete().eq("id", submissionId)

    if (error) {
      console.error("Error deleting submission:", error)
      throw new Error(`Failed to delete submission: ${error.message}`)
    }

    console.log(`Successfully deleted submission ${submissionId}`)
    return { success: true }
  } catch (err) {
    console.error("Exception in deleteSubmission:", err)
    throw new Error(`Failed to delete submission: ${err.message}`)
  }
}

// Save main category for a submission
export async function saveMainCategory(submissionId: number, mainCategory: string, reviewerName: string) {
  const supabase = createClient()

  try {
    // First, fetch the current data to preserve existing structure
    const { data: currentData, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("data")
      .eq("id", submissionId)
      .single()

    if (fetchError) {
      console.error("Error fetching current data:", fetchError)
      throw new Error(`Failed to fetch current data: ${fetchError.message}`)
    }

    // Update all questions with the main category
    let updatedData
    if (Array.isArray(currentData.data)) {
      // Old format: convert to new format with metadata and update all questions
      const questionsWithCategory = currentData.data.map((q: any) => ({
        ...q,
        mainCategory: mainCategory,
      }))
      updatedData = {
        questions: questionsWithCategory,
        mainCategory: mainCategory,
        mainCategoryBy: reviewerName,
        mainCategoryTimestamp: new Date().toISOString(),
      }
    } else {
      // New format: preserve existing structure and update questions and metadata
      const questionsWithCategory = (currentData.data.questions || []).map((q: any) => ({
        ...q,
        mainCategory: mainCategory,
      }))
      updatedData = {
        ...currentData.data,
        questions: questionsWithCategory,
        mainCategory: mainCategory,
        mainCategoryBy: reviewerName,
        mainCategoryTimestamp: new Date().toISOString(),
      }
    }

    // Update the record with the new data
    const { error } = await supabase.from("user_submitted_data").update({ data: updatedData }).eq("id", submissionId)

    if (error) {
      console.error("Error updating main category:", error)
      throw new Error(`Failed to update main category: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Exception in saveMainCategory:", err)
    throw new Error(`Failed to save main category: ${err.message}`)
  }
}

// Save subcategory1 for a submission
export async function saveSubcategory1(submissionId: number, subcategory1: string, reviewerName: string) {
  const supabase = createClient()

  try {
    // First, fetch the current data to preserve existing structure
    const { data: currentData, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("data")
      .eq("id", submissionId)
      .single()

    if (fetchError) {
      console.error("Error fetching current data:", fetchError)
      throw new Error(`Failed to fetch current data: ${fetchError.message}`)
    }

    // Update all questions with the subcategory1
    let updatedData
    if (Array.isArray(currentData.data)) {
      // Old format: convert to new format with metadata and update all questions
      const questionsWithSubcategory = currentData.data.map((q: any) => ({
        ...q,
        subcategory1: subcategory1,
      }))
      updatedData = {
        questions: questionsWithSubcategory,
        subcategory1: subcategory1,
        subcategory1By: reviewerName,
        subcategory1Timestamp: new Date().toISOString(),
      }
    } else {
      // New format: preserve existing structure and update questions and metadata
      const questionsWithSubcategory = (currentData.data.questions || []).map((q: any) => ({
        ...q,
        subcategory1: subcategory1,
      }))
      updatedData = {
        ...currentData.data,
        questions: questionsWithSubcategory,
        subcategory1: subcategory1,
        subcategory1By: reviewerName,
        subcategory1Timestamp: new Date().toISOString(),
      }
    }

    // Update the record with the new data
    const { error } = await supabase.from("user_submitted_data").update({ data: updatedData }).eq("id", submissionId)

    if (error) {
      console.error("Error updating subcategory1:", error)
      throw new Error(`Failed to update subcategory1: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Exception in saveSubcategory1:", err)
    throw new Error(`Failed to save subcategory1: ${err.message}`)
  }
}

// Save subcategory2 for a submission
export async function saveSubcategory2(submissionId: number, subcategory2: string, reviewerName: string) {
  const supabase = createClient()

  try {
    // First, fetch the current data to preserve existing structure
    const { data: currentData, error: fetchError } = await supabase
      .from("user_submitted_data")
      .select("data")
      .eq("id", submissionId)
      .single()

    if (fetchError) {
      console.error("Error fetching current data:", fetchError)
      throw new Error(`Failed to fetch current data: ${fetchError.message}`)
    }

    // Update all questions with the subcategory2
    let updatedData
    if (Array.isArray(currentData.data)) {
      // Old format: convert to new format with metadata and update all questions
      const questionsWithSubcategory = currentData.data.map((q: any) => ({
        ...q,
        subcategory2: subcategory2,
      }))
      updatedData = {
        questions: questionsWithSubcategory,
        subcategory2: subcategory2,
        subcategory2By: reviewerName,
        subcategory2Timestamp: new Date().toISOString(),
      }
    } else {
      // New format: preserve existing structure and update questions and metadata
      const questionsWithSubcategory = (currentData.data.questions || []).map((q: any) => ({
        ...q,
        subcategory2: subcategory2,
      }))
      updatedData = {
        ...currentData.data,
        questions: questionsWithSubcategory,
        subcategory2: subcategory2,
        subcategory2By: reviewerName,
        subcategory2Timestamp: new Date().toISOString(),
      }
    }

    // Update the record with the new data
    const { error } = await supabase.from("user_submitted_data").update({ data: updatedData }).eq("id", submissionId)

    if (error) {
      console.error("Error updating subcategory2:", error)
      throw new Error(`Failed to update subcategory2: ${error.message}`)
    }

    return { success: true }
  } catch (err) {
    console.error("Exception in saveSubcategory2:", err)
    throw new Error(`Failed to save subcategory2: ${err.message}`)
  }
}
