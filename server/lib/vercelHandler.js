import { createApp } from "./app.js";

// Reuse the Express app for each explicit Vercel function entry point.
const app = createApp();

export default app;
