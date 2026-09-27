import { createApp } from "./lib/app.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = createApp();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.SERVER_PORT || 4000);

app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.listen(port, () => console.log(`LapGPT is ready at http://localhost:${port}`));
