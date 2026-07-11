// Run once: cd api/db && node setup-poe2.js
// Creates the poe2 app entry and table in Supabase.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", ".env") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  db: { schema: "public" },
});

async function setup() {
  // 1. Insert app entry
  const { error: appErr } = await supabase
    .from("apps")
    .upsert({ id: 6, name: "poe2" }, { onConflict: "id" });

  if (appErr) {
    console.error("Failed to insert app entry:", appErr.message);
    process.exit(1);
  }
  console.log("✓ App entry 'poe2' (id=6) upserted.");

  // 2. Create table via SQL
  const sql = `
    CREATE TABLE IF NOT EXISTS poe2 (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `;

  const { data, error: sqlErr } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();

  if (sqlErr) {
    // Try direct SQL via Data API
    const pgResp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!pgResp.ok) {
      console.log("\n⚠ Could not auto-create table. Run this SQL in Supabase SQL Editor:\n");
      console.log(sql);
      console.log("\nThen re-run: node setup-poe2.js");
      process.exit(0);
    }
  }

  console.log("✓ Table 'poe2' created.");
  console.log("\nSetup complete!");
}

setup();
