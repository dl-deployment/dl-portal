import { getSheets, SPREADSHEET_ID } from "../google-sheets.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiSecret = process.env.API_SECRET;
  const authHeader = req.headers["x-api-key"];
  if (!apiSecret || authHeader !== apiSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { action, page, sheetId, sheetName, rowIndex, name } = req.body || {};

  try {
    const sheets = await getSheets();

    if (action === "add") {
      if (!page?.name || !page?.url || !sheetName) {
        return res.status(400).json({ error: "name, url, and sheetName are required" });
      }
      const safeTitle = `'${sheetName.replace(/'/g, "''")}'`;
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${safeTitle}!A:B`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[page.name, page.url]],
        },
      });
      return res.json({ success: true });
    }

    if (action === "delete") {
      if (sheetId === undefined || !rowIndex || rowIndex < 2) {
        return res.status(400).json({ error: "Invalid sheetId or rowIndex" });
      }
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex,
                },
              },
            },
          ],
        },
      });
      return res.json({ success: true });
    }

    if (action === "create-tab") {
      if (!name) {
        return res.status(400).json({ error: "name is required" });
      }
      const result = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            { addSheet: { properties: { title: name } } },
          ],
        },
      });
      const newSheet = result.data.replies[0].addSheet.properties;
      const safeTitle = `'${name.replace(/'/g, "''")}'`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${safeTitle}!A1:B1`,
        valueInputOption: "RAW",
        requestBody: { values: [["name", "url"]] },
      });
      return res.json({
        success: true,
        data: { id: newSheet.sheetId, name: newSheet.title },
      });
    }

    if (action === "rename-tab") {
      if (sheetId === undefined || !name) {
        return res.status(400).json({ error: "sheetId and name are required" });
      }
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: { sheetId, title: name },
                fields: "title",
              },
            },
          ],
        },
      });
      return res.json({ success: true });
    }

    if (action === "delete-tab") {
      if (sheetId === undefined) {
        return res.status(400).json({ error: "sheetId is required" });
      }
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ deleteSheet: { sheetId } }],
        },
      });
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
