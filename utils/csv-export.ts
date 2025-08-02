/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV formatted string
 */
export function convertToCSV(data: any[], headers?: string[]) {
  if (data.length === 0) return ""

  // Determine headers from the first object if not provided
  const columnHeaders = headers || Object.keys(data[0])

  // Create header row
  const headerRow = columnHeaders.join(",")

  // Create data rows
  const rows = data
    .map((item) => {
      return columnHeaders
        .map((header) => {
          // Get the value for this header
          const value = item[header]

          // Handle different value types
          let cellValue = value === null || value === undefined ? "" : value.toString()

          // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
          if (cellValue.includes(",") || cellValue.includes('"') || cellValue.includes("\n")) {
            cellValue = '"' + cellValue.replace(/"/g, '""') + '"'
          }

          return cellValue
        })
        .join(",")
    })
    .join("\n")

  // Combine header and rows
  return headerRow + "\n" + rows
}

/**
 * Download data as a CSV file
 * @param data The data to download
 * @param filename The name of the file
 */
export function downloadCSV(data: string, filename: string) {
  // Create a blob with the data
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" })

  // Create a download link
  const link = document.createElement("a")

  // Support for browsers that have the download attribute
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename)
  } else {
    // Other browsers
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
