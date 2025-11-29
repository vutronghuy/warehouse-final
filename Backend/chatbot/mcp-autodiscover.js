// scripts/mcp-autodiscover.js
const fs = require("fs");
require('dotenv').config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;
const OUT_FILE = "mcp.config.json";

// blacklist collection không muốn expose cho AI
const DEFAULT_BLACKLIST = ["system.profile", "system.indexes", "sessions", "tokens", "users", "auth"];

// helper
function sanitizeName(n) {
  return String(n).trim();
}

async function main() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const cols = await db.listCollections().toArray();
    let names = cols.map(c => sanitizeName(c.name)).filter(n => !n.startsWith("system."));

    // loại trừ blacklist
    names = names.filter(n => !DEFAULT_BLACKLIST.includes(n));

    const config = {
      connections: {
        default: {
          uri: "${MONGO_URI}", 
          database: DB_NAME,
          collections: names
        }
      },
      options: {
        maxDocs: 5,
        enableVectorSearch: false
      }
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(config, null, 2), { encoding: "utf8" });
    console.log(`✅ Wrote ${OUT_FILE}`);
    console.log("Collections:", names);
  } catch (err) {
    console.error("Error in autodiscover:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
