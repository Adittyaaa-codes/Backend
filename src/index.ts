import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';                
import app from './app.ts'
import connectDB from './db.ts';
import ApiError from './utils/ApiError.ts';
import axios from 'axios';

const port = 3000;

connectDB()
.then(() => {
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
}).catch((error) => {
  console.error('Failed to connect to the database:', error);
});