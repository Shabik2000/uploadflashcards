"use server"

import { addSheet, updateValues } from "@/utils/google-sheets-browser"

// Process the pasted data from Excel/Google Sheets
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

export async function submitDataToSheets(formData: FormData) {
  const username = formData.get("username") as string
  const topic = formData.get("topic") as string
  const description = formData.get("description") as string
  const rawData = formData.get("data") as string

  // Validate form data
  if (!username || !topic || !description || !rawData) {
    return {
      error: "All fields are required",
      success: false,
    }
  }

  // Validate field lengths
  if (topic.length < 10 || topic.length > 30) {
    return {
      error: "Study set name must be between 10 and 30 characters",
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

  // Validate that we have at least 25 rows
  if (rows.length < 25) {
    return {
      error: "Minimum 25 questions and answers required",
      success: false,
      rowCount: rows.length,
    }
  }

  try {
    // Use the provided private key
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "flashcardinput@submit-459422.iam.gserviceaccount.com"
    const privateKey =
      "MIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCp/ei3EkfBB2e8\no/T+jftkkg5X7ARMBV+vZcUPb0Y1Wu+TH4KaT+W3Ow2PWQ/JC33IX8vDV1evrQcq\n3vGvsC0wHcQpiB9FQIrKSVvgzdfSmHOGMd8BkhiovGWSaMhkFxAjgYJxpFFkufyK\n0YpaUYUoAbkn6a4Jy4xWpLznNHQW2XuJGrmn1PPuqxQOTbxLLPAwnFJ/tZqnJp5c\njsu3jkeZfaTwNWITgo6LeEEOoUxtjmCvK0MbT1/Wk4VyQsXkjMWHptNfU7MQT3NV\ngDU32Aurt5PLVeR02zmOC6hFtxMtDudAe1lut/iszrCp19jUjFvu2YDrsuNE01qS\nhOE/8/RTAgMBAAECgf8XGZClIXm196i8Rz3czeqRz5S+jGs/Xbmi9UirPOBdCmsH\nwZ2BqEKHTlg7zTPMTKwv471gI3aQpuMcJpRzHNMHKzLht7y2pKnK8luZZykjJ3VF\nkMcpvQ270LdSFq0FeIlzE2wazvOlZxUJW48j3aJ4pn167wB5XAjc1I3POmjKJj0c\nvWIq4/jEB6FINAWGMNMTjta87bZJuUePAtSEHoWJtKXg881Q7v7jE9cb8dR3yHqG\nH3EvbXd3pFOz6E+flhstDblnV5Nhw+SjTJgRcIB+6NstEfFCnKouZsDHyNazNS6F\nSAvU/7MhmiOD/UuM4eWBB4/JfDNCmUMe7viAfwECgYEA4/qV7X7XARRgaP7vVz9K\nUSIFa+uokdNL2rSRzGz/V+d2D/f7qSN9DUfJAi3v7AG8Ri5LK1Jm0ELmPUhgb+wk\nOZF0yKHRDNlQz3rGPlqwU+bc9P/DlTT8Q+31TlbHTnDJA0pSL67PdrvEzjGuzzId\nL9NwOkMAViTsk2V3FMBy0SECgYEAvuK/JHrSjelxreTjhO8eDF3WaNw6yCBB2XBU\nrD+O4bd+L6pxJR88TCxmjHHiqTQ+NFdunVKQXNZyI/Rsff6D9Wdqv5H741cM5SAA\nSR9cnCXzdZRdesGW0JGNPvN0WwmIxILO6kCxFQ3QXyZ+DenTIa5212U7HmK4Hmy6\nnc8/MvMCgYBHGYSer/sv7AHxXOiaBjQQP5L/SFynNgWnLL93yNqNuLMaYdWLt3St\nqqCm3FrB+PyVyqRI24cTFnolzKe+4B+gEJwiYk0HO9M3Eew30CLD1/E7O3Ts2LyA\nFvt1Nh0seoJGU2x0UImFVyQWxmnlVpTBsKiEkxbMxvE9Oty7jRWB4QKBgFAroYXr\nw+TwZ9tWJ6ycVS1yd+vAmzuUOLPfNuDFLPhl/ax9VFn3/XYsq8FOz5irJXkMQ5v1\nokYrlvK85JgiPj/ieHYPFRDNbdAJmbUcY+P9GHyInJ5DEll02DLZQ0Q9A+Es40SF\neRpTm/FqlES5sQATazxZ+vNvGM9GcTZ4ZZ27AoGAE98+kb2z5qJOBTxMlF1KC4SC\noL3StbExh0iWlpn9mKM8a8hStTB/bXFCWPXj/mW9PUv4hbUOZ/gC46WH2wj40l4w\nCi7pzTOKH5hDZ1v3I96mq4mN62Gfuo1jkt8LSqnlPo4w3jHV2esOi1pqJXOg4AF/\nC5fVg1SquA/GRR8+NO8="
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "1T1_pcz_qv1YTQOY0LhFBJOWFdrK3tEVM0FUF7w8-R4o"

    // Create a safe sheet title (remove special characters that might cause issues)
    const safeTitle = `${topic.replace(/[^\w\s-]/g, "")}-${new Date().toISOString().split("T")[0]}`

    // Add a new sheet
    const sheetResult = await addSheet(spreadsheetId, safeTitle, clientEmail, privateKey)

    if (!sheetResult.success) {
      return {
        error: `Could not create a new sheet: ${sheetResult.error}`,
        success: false,
      }
    }

    // Prepare metadata for the submission
    const metadataValues = [
      ["Submission Date", new Date().toISOString()],
      ["Username", username],
      ["Topic", topic],
      ["Description", description],
      ["Number of Questions", rows.length.toString()],
      [""], // Empty row as separator
      ["Question", "Answer", "Read More"], // Headers for the data
    ]

    // Prepare the question data
    const questionValues = rows.map((row) => [row.question, row.answer, row.readMore || ""])

    // Combine metadata and questions
    const values = [...metadataValues, ...questionValues]

    // Update the values in the sheet
    const updateResult = await updateValues(spreadsheetId, `${safeTitle}!A1`, values, clientEmail, privateKey)

    if (!updateResult.success) {
      return {
        error: `Could not update sheet values: ${updateResult.error}`,
        success: false,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error)
    return {
      error: `Failed to submit data to Google Sheets: ${error.message || "Unknown error"}`,
      success: false,
    }
  }
}
