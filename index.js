import express from "express";
import cors from "cors";
import connect from "./database/conn.js";
const app = express();
app.use(express.json());
app.use(cors());
import dotenv from 'dotenv';
import router from './routes/index.js'
dotenv.config()
const PORT = process.env.PORT||8080;
connect();
app.get('/',(req,res)=>{
    res.status(201).json('Home get Request')
})
app.use("/api/v1", router);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});