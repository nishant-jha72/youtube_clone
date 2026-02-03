import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});
import connectDB from "./db/index.js";
const PORT = process.env.PORT || 8000;

connectDB()













// ;(async  () => {
//     try {
//         await connectDB();
//         console.log("Connected to MongoDB");
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//     }
// })()
//         });
//         console.log("Connected to MongoDB");
//     } catch (error) {
//         console.error("Error connecting to MongoDB:", error);
//     }
// })()