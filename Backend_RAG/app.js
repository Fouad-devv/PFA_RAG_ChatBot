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


// Keycloak
import session from 'express-session';
import { keycloak, memoryStore } from './config/keycloak.js';


//importing protected routes
import homeRoute from './routers/homeRoute.js';
import publicRoute from './routers/publicRoute.js';


// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT ;

app.use(cors({ origin: 'http://localhost:5173', credentials: true, }));  // My front-end
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Session for Keycloak
app.use(
  session({
    secret: 'some-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);
// Keycloak middleware
app.use(keycloak.middleware());



//_______________________________________________________________

app.use('/api/public' , publicRoute);

app.use(keycloak.protect(), attachUserId);
// routes
app.use('/api/home' , homeRoute);
//app.use('/api/orders/admin', keycloak.protect('realm:admin'), adminOrderRoute);



// Assure connection ti DB before listenning
mongoose.connection.once('open', () => {
  console.log('Connected to database')

  app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}....`);
  });
})
