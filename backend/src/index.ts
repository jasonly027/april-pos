import express from "express";
import postgres from "postgres";
import fs from "fs";

const sql = postgres({
  host: process.env.DB_HOST ?? "db",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password:
    process.env.DB_PASSWORD ??
    fs.readFileSync("/run/secrets/april-pos-db-password", "utf8").trim(),
});

sql`SELECT 1`
  .then(() => {
    console.log("Connected to DB");

    const app = express();

    app.get("/", (req, res) => {
      res.status(200).send();
    });

    const PORT = Number(process.env.PORT);

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT.toString()}`);
    });
  })
  .catch((err: unknown) => {
    console.error("DB connection error:", err);
  });
