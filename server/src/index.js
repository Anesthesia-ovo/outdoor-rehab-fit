import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { createDatabase } from "./database.js";

const config = readConfig();
const database = createDatabase(config.databasePath);
const app = createApp({
  database,
  jwtSecret: config.jwtSecret,
  smsMode: config.smsMode,
  twilio: config.twilio,
});

const server = app.listen(config.port, "127.0.0.1", () => {
  console.log(`OUTDOOR-FIT API listening on http://127.0.0.1:${config.port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
