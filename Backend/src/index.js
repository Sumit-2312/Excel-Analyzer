import express from 'express';
import cors from 'cors';
import verifyToken from './middleware.js';
import authRouter from './Routes/authrouter.js';
const app = express();
app.use(express.json());
app.use(cors());


app.use('/auth',authRouter);
// this middleware will be user for all other routes
app.use(verifyToken);

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})