import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';
import app from './app';
import connectDB from './db';
import ApiError from './utils/ApiError';

const port = 3000;

connectDB()
.then(() => {
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
}).catch((error) => {
  console.error('Failed to connect to the database:', error);
});