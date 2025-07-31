import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send();
});

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT.toString()}`);
});
