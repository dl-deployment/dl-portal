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

  try {
    const sheets = await getSheets();

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetList = spreadsheet.data.sheets || [];
    const tabs = sheetList.map((s) => ({
      id: s.properties.sheetId,
      name: s.properties.title,
    }));

    if (tabs.length === 0) {
      return res.json({ success: true, data: { tabs: [], pages: [] } });
    }

    const ranges = tabs.map(
      (t) => `'${t.name.replace(/'/g, "''")}'!A2:B`
    );
    const batchResult = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    });

    const pages = [];
    const valueRanges = batchResult.data.valueRanges || [];
    for (let ti = 0; ti < tabs.length; ti++) {
      const rows = valueRanges[ti]?.values || [];
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i][0] && !rows[i][1]) continue;
        pages.push({
          id: i + 2,
          name: rows[i][0] || "",
          url: rows[i][1] || "",
          sheetId: tabs[ti].id,
        });
      }
    }

    res.json({ success: true, data: { tabs, pages } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
