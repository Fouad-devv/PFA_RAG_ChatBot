import dotenv from 'dotenv';
dotenv.config();
import express from "express";

//database
import mongoose from 'mongoose';
import { connectDB } from './config/mongoConn.js';

//importing middlewares
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { attachUserId } from './Middleware/attachUserId.js';
import { verifyToken } from './Middleware/verifyToken.js';

//importing routes
import homeRoute from './routers/homeRoute.js';
import publicRoute from './routers/publicRoute.js';
import adminRoute from './routers/adminRoute.js';


// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//_______________________________________________________________

app.use('/api/public', publicRoute);

app.use(verifyToken, attachUserId);
app.use('/api/home', homeRoute);
app.use('/api/admin', adminRoute);



// Assure connection ti DB before listenning
mongoose.connection.once('open', () => {
  console.log('Connected to database')

  app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}....`);
  });
})
