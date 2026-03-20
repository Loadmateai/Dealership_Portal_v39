const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const fsPromises = fs.promises;

// Ensure the uploads directory always exists
if (!fs.existsSync('uploads/')) {
    fs.mkdirSync('uploads/', { recursive: true });
}

// 1. Switch to Memory Storage (RAM)
// We hold the file in RAM temporarily so Sharp can process it before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // We accept all files. The processor below will separate images from PDFs.
    cb(null, true);
};

const multerUpload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit: 5MB per file to protect your RAM
    },
    fileFilter: fileFilter
});

// 2. Custom Processing Step (Sharp Compression)
const processSingleFile = async (file) => {
    if (!file) return;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const isImage = file.mimetype.startsWith('image/');
    
    let filename;
    let filepath;

    if (isImage) {
        // --- IMAGE OPTIMIZATION ---
        // Force .webp extension for massively reduced file sizes
        filename = `${file.fieldname}-${uniqueSuffix}.webp`;
        filepath = path.join('uploads', filename);
        
        await sharp(file.buffer)
            .webp({ quality: 80 }) // Compress to 80% visual quality
            .toFile(filepath);
    } else {
        // --- PDF / DOCX HANDLING ---
        // Do not alter PDFs. Just write the raw buffer directly to disk.
        const ext = path.extname(file.originalname);
        filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        filepath = path.join('uploads', filename);
        
        await fsPromises.writeFile(filepath, file.buffer);
    }

    // Attach the new details back to the file object.
    // This makes it a perfect drop-in replacement so your req.file.path works in your routes!
    file.filename = filename;
    file.path = filepath.replace(/\\/g, '/'); 
};

// Middleware that catches the files after Multer, runs them through our processor, then moves to your Route
const processFiles = async (req, res, next) => {
    try {
        if (req.file) {
            await processSingleFile(req.file);
        } else if (req.files) {
            if (Array.isArray(req.files)) {
                await Promise.all(req.files.map(processSingleFile));
            } else {
                // Handles upload.fields() objects
                const promises = [];
                for (const fieldname in req.files) {
                    req.files[fieldname].forEach(file => promises.push(processSingleFile(file)));
                }
                await Promise.all(promises);
            }
        }
        next();
    } catch (error) {
        console.error('Image processing failed:', error);
        res.status(500).json({ msg: 'Server error during file upload processing' });
    }
};

// 3. Export Drop-In Replacements
// Express allows routing to accept an array of middlewares.
// Now, when your route calls `upload.single('file')`, it runs Multer AND Sharp!
const upload = {
    single: (name) => [multerUpload.single(name), processFiles],
    array: (name, maxCount) => [multerUpload.array(name, maxCount), processFiles],
    fields: (fields) => [multerUpload.fields(fields), processFiles],
    any: () => [multerUpload.any(), processFiles]
};

module.exports = upload;