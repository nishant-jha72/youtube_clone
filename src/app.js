import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running..." });
});
// routes import 
import userRoutes from "./routes/user.routes.js";
app.use("/api/v1/users", userRoutes);
export { app };