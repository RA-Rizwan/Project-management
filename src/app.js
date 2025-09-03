import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import heathcheckrouter from "./routes/healthcheck.routes.js"
dotenv.config({
    path: "./.env",
});

const app = express();

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"]
}),);
app.use("/api/v1/health",heathcheckrouter)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

export default app;
