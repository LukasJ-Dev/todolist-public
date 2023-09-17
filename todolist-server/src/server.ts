import express, { Express } from "express";
import router from "./routes/routes";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import cors from "cors";

const apiURL = "/api/v1";

connectToDB().catch((err) => console.log(err));

async function connectToDB() {
  if (!process.env.DATABASE)
    throw new Error("Couldn't find the database in the .env file.");
  await mongoose.connect(process.env.DATABASE);
}

const app: Express = express();

app.use(helmet());

const limiter = rateLimit({
  max: 200,
  windowMs: 15 * 60 * 100,
  message: "Rate limit exceeded. Please try again in a few minutes.",
  legacyHeaders: false,
});

app.use(apiURL, limiter);

app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(apiURL, router);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}...`);
});
