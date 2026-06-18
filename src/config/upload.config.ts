// src/config/upload.config.ts
import multer from 'multer';

// Use memory storage — files are held as Buffer in RAM.
// This avoids filesystem permission issues on cloud platforms (Render, Railway, etc.)
// Files are forwarded directly to FastAPI without writing to disk.
const storage = multer.memoryStorage();

// File filter - accept only PDFs, DOCX, and TXT
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX and TXT allowed.'));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024  // 10MB max
    }
});
