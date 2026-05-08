import { google } from "googleapis";

let _sheets = null;

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export function getSheets() {
  if (_sheets) return _sheets;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  _sheets = google.sheets({ version: "v4", auth: oauth2Client });
  return _sheets;
}
