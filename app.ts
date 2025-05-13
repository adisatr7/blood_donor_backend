import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import errorHandler from "./middlewares/errorHandler";
import routes from "./routes/v1/index";

dotenv.config();

const app = express();

// Middlewares
app.use(morgan("combined")); // Log all HTTP requests
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// Import controllers
app.use("/api/v1/", routes);

// Error middleware
app.use(errorHandler);

app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Backend server is running on port ${process.env.BACKEND_PORT}!`);
});
