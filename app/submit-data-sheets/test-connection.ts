"use server"

import { getSpreadsheetInfo } from "@/utils/google-sheets-browser"

export async function testGoogleSheetsConnection() {
  try {
    // Use the provided private key
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "flashcardinput@submit-459422.iam.gserviceaccount.com"
    const privateKey =
      "MIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCp/ei3EkfBB2e8\no/T+jftkkg5X7ARMBV+vZcUPb0Y1Wu+TH4KaT+W3Ow2PWQ/JC33IX8vDV1evrQcq\n3vGvsC0wHcQpiB9FQIrKSVvgzdfSmHOGMd8BkhiovGWSaMhkFxAjgYJxpFFkufyK\n0YpaUYUoAbkn6a4Jy4xWpLznNHQW2XuJGrmn1PPuqxQOTbxLLPAwnFJ/tZqnJp5c\njsu3jkeZfaTwNWITgo6LeEEOoUxtjmCvK0MbT1/Wk4VyQsXkjMWHptNfU7MQT3NV\ngDU32Aurt5PLVeR02zmOC6hFtxMtDudAe1lut/iszrCp19jUjFvu2YDrsuNE01qS\nhOE/8/RTAgMBAAECgf8XGZClIXm196i8Rz3czeqRz5S+jGs/Xbmi9UirPOBdCmsH\nwZ2BqEKHTlg7zTPMTKwv471gI3aQpuMcJpRzHNMHKzLht7y2pKnK8luZZykjJ3VF\nkMcpvQ270LdSFq0FeIlzE2wazvOlZxUJW48j3aJ4pn167wB5XAjc1I3POmjKJj0c\nvWIq4/jEB6FINAWGMNMTjta87bZJuUePAtSEHoWJtKXg881Q7v7jE9cb8dR3yHqG\nH3EvbXd3pFOz6E+flhstDblnV5Nhw+SjTJgRcIB+6NstEfFCnKouZsDHyNazNS6F\nSAvU/7MhmiOD/UuM4eWBB4/JfDNCmUMe7viAfwECgYEA4/qV7X7XARRgaP7vVz9K\nUSIFa+uokdNL2rSRzGz/V+d2D/f7qSN9DUfJAi3v7AG8Ri5LK1Jm0ELmPUhgb+wk\nOZF0yKHRDNlQz3rGPlqwU+bc9P/DlTT8Q+31TlbHTnDJA0pSL67PdrvEzjGuzzId\nL9NwOkMAViTsk2V3FMBy0SECgYEAvuK/JHrSjelxreTjhO8eDF3WaNw6yCBB2XBU\nrD+O4bd+L6pxJR88TCxmjHHiqTQ+NFdunVKQXNZyI/Rsff6D9Wdqv5H741cM5SAA\nSR9cnCXzdZRdesGW0JGNPvN0WwmIxILO6kCxFQ3QXyZ+DenTIa5212U7HmK4Hmy6\nnc8/MvMCgYBHGYSer/sv7AHxXOiaBjQQP5L/SFynNgWnLL93yNqNuLMaYdWLt3St\nqqCm3FrB+PyVyqRI24cTFnolzKe+4B+gEJwiYk0HO9M3Eew30CLD1/E7O3Ts2LyA\nFvt1Nh0seoJGU2x0UImFVyQWxmnlVpTBsKiEkxbMxvE9Oty7jRWB4QKBgFAroYXr\nw+TwZ9tWJ6ycVS1yd+vAmzuUOLPfNuDFLPhl/ax9VFn3/XYsq8FOz5irJXkMQ5v1\nokYrlvK85JgiPj/ieHYPFRDNbdAJmbUcY+P9GHyInJ5DEll02DLZQ0Q9A+Es40SF\neRpTm/FqlES5sQATazxZ+vNvGM9GcTZ4ZZ27AoGAE98+kb2z5qJOBTxMlF1KC4SC\noL3StbExh0iWlpn9mKM8a8hStTB/bXFCWPXj/mW9PUv4hbUOZ/gC46WH2wj40l4w\nCi7pzTOKH5hDZ1v3I96mq4mN62Gfuo1jkt8LSqnlPo4w3jHV2esOi1pqJXOg4AF/\nC5fVg1SquA/GRR8+NO8="
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "1T1_pcz_qv1YTQOY0LhFBJOWFdrK3tEVM0FUF7w8-R4o"

    // Check if environment variables are set
    if (!clientEmail || !privateKey || !spreadsheetId) {
      return {
        success: false,
        error: "Missing Google Sheets configuration",
        details: {
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
          hasSpreadsheetId: !!spreadsheetId,
        },
      }
    }

    // Use our browser-compatible function to get spreadsheet info
    const result = await getSpreadsheetInfo(spreadsheetId, clientEmail, privateKey)

    if (result.success) {
      return {
        success: true,
        spreadsheetTitle: result.title,
        sheetsCount: result.sheetsCount,
        message: "Successfully connected to Google Sheets!",
      }
    } else {
      return {
        success: false,
        error: result.error || "Unknown error",
        message: "Failed to connect to Google Sheets. See details below.",
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Unknown error",
      message: "Failed to connect to Google Sheets. See details below.",
    }
  }
}
