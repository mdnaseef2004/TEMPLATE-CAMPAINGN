import { NextResponse } from "next/server";
import { google } from "googleapis";

// Node.js server action context (for Vercel compatibility)
export async function POST(req: Request) {
  try {
    const { name, phoneNumber, campaignId, campaignTitle, creatorEmail } = await req.json();

    if (!name || !phoneNumber || !campaignId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!serviceEmail || !privateKey) {
      console.warn("Google Service Account details are missing. Google Sheets integration will operate in offline mode.");
      return NextResponse.json({ 
        success: true, 
        sheetSync: false, 
        message: "Google credentials not set. Logged locally in database." 
      });
    }

    // Format the private key (handles both escaped and literal newlines)
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

    // Initialize google auth client
    const auth = new google.auth.JWT({
      email: serviceEmail,
      key: formattedPrivateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
      ]
    });

    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // Step 1: Let's check if we have a spreadsheetId already.
    // If not, we will create a new sheet and return the sheet ID so that the client can update Firestore!
    let spreadsheetId = req.headers.get("x-spreadsheet-id");
    let isNewSheet = false;
    let spreadsheetUrl = "";

    if (!spreadsheetId || spreadsheetId === "null" || spreadsheetId === "undefined") {
      isNewSheet = true;
      
      // Create a spreadsheet
      const resource = {
        properties: {
          title: `TwibbonCraft - ${campaignTitle || "Campaign"} Participants`,
        },
      };

      const response = await sheets.spreadsheets.create({
        requestBody: resource,
        fields: "spreadsheetId,spreadsheetUrl",
      });

      spreadsheetId = response.data.spreadsheetId || null;
      spreadsheetUrl = response.data.spreadsheetUrl || "";

      if (!spreadsheetId) {
        throw new Error("Failed to create Google Spreadsheet");
      }

      // Add Headers to the first sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:C1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Name", "Phone Number", "Date Joined"]],
        },
      });

      // Share sheet: Allow "anyone with the link" to view the spreadsheet.
      // This allows the creator to view the sheet link directly without credentials!
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (permissionError) {
        console.error("Error setting public drive permissions on new spreadsheet:", permissionError);
      }

      // If a creator's email exists, we also share it as writer/editor specifically!
      if (creatorEmail) {
        try {
          await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
              role: "writer",
              type: "user",
              emailAddress: creatorEmail,
            },
            sendNotificationEmail: false,
          });
        } catch (shareCreatorError) {
          console.error("Error sharing spreadsheet directly with creator email:", shareCreatorError);
        }
      }
    }

    // Step 2: Append row with participant data
    const currentDate = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phoneNumber, `${currentDate} (UTC)`]],
      },
    });

    return NextResponse.json({
      success: true,
      sheetSync: true,
      spreadsheetId,
      spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      isNewSheet,
      message: "Synced to Google Sheet successfully!"
    });

  } catch (error: any) {
    console.error("Google Sheets API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to sync to Google Sheets." 
    }, { status: 500 });
  }
}
