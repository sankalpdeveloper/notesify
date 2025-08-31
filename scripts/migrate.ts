import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/client";

async function main() {
  await migrate(db, { migrationsFolder: "drizzle" });
  await pool.end();
  console.log("✅ Migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
