import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const payload = await req.json();
    const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL;

    console.log("Sync Sheets Request Triggered:", payload.order_number);

    if (!scriptUrl) {
      console.warn("GOOGLE_SHEETS_SCRIPT_URL environment variable is not defined. Skipping live Google Sheets synchronization.");
      return NextResponse.json({ 
        success: true, 
        message: "Offline sync bypass: GOOGLE_SHEETS_SCRIPT_URL is not set." 
      });
    }

    // Post to Google Apps Script Webhook
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Script returned status code ${response.status}`);
    }

    const result = await response.text();
    console.log("Google Apps Script sync response:", result);

    return NextResponse.json({ 
      success: true, 
      message: "Synced to Google Sheets successfully", 
      result 
    });
  } catch (error) {
    console.error("Google Sheets sync failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync to Google Sheets" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json({
        success: false,
        message: "GOOGLE_SHEETS_SCRIPT_URL is not configured."
      }, { status: 400 });
    }

    const action = searchParams.get("action");

    if (action === "export_backup") {
      const response = await fetch(`${scriptUrl}?action=export_backup`);
      if (!response.ok) {
        throw new Error(`Google Apps Script responded with status ${response.status}`);
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (!phone && !name) {
      return NextResponse.json({
        success: false,
        message: "Missing lookup query parameters (phone, name or action)"
      }, { status: 400 });
    }

    const queryParam = phone 
      ? `phone=${encodeURIComponent(phone)}` 
      : `name=${encodeURIComponent(name)}`;

    const response = await fetch(`${scriptUrl}?${queryParam}`);

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to query balance from Google Sheets:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to query Google Sheets" },
      { status: 500 }
    );
  }
}
