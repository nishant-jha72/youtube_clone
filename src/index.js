import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});
import connectDB from "./db/index.js";
import { app } from "./app.js";
const PORT = process.env.PORT || 5000;

connectDB()
.then(app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}))
.catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});













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