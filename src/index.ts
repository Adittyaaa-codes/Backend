import dotenv from 'dotenv';
dotenv.config();

import { Request, Response } from 'express';                
import app from './app.ts'
import connectDB from './db.ts';
import ApiError from './utils.ts/ApiError.ts';
import axios from 'axios';

const port = 3000;

app.get('/', (req:Request, res:Response) => {
    res.send('Hello World! TS');
});

// app.post('/chat/qa', async (req: Request, res: Response) => {
//     try {
//         const { query} = req.body;
        
//         if (!query) {
//             return res.status(400).json({ error: 'Query is required' });
//         }
        
//         const response = await axios.post(
//             'http://localhost:8000/chat/qa',
//             { query: query },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     // 'X-User-ID': userId
//                 }
//             }
//         );
        
//         res.json(response.data);
        
//     } catch (error: any) {
//         console.error('AI request failed:', error.message);
        
//         if (error.response) {
//             return res.status(error.response.status).json({
//                 error: error.response.data?.detail || 'AI service error'
//             });
//         }
        
//         res.status(500).json({ error: 'Failed to connect to AI service' });
//     }
// });


connectDB()
.then(() => {
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
}).catch((error) => {
  console.error('Failed to connect to the database:', error);
});