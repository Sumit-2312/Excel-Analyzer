import express from 'express';
import multer from 'multer';
import storage from '../utils/diskStorage.js';
import fileFilter from '../utils/filefilter.js';
import { Uploads } from '../db.js';
import fs from 'fs';

const uploadRouter = express.Router();


// Multer configuration
const upload = multer({
    storage : storage,
    fileFilter: fileFilter,
    limits: {
        fileSize : 1024 * 1024 * 5 // 5 MB file size limit
    }
});



// All these request will be handled by the middleware before reaching to this point
// so we will assume that the user is authenticated and userId is available in req.userId
// to upload the file in the express server , we need the multer package


const singleUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('excel')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

uploadRouter.post('/', async (req, res) => {
  try {
    await singleUpload(req, res); // this will throw an error if the file has an issue

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const data = req.file;

    const exists = await Uploads.findOne({originalname: data.originalname})
    if(exists) res.status(400).json({message: "this file aleady exists, try with a different name"});



    const fileBuffer = fs.readFileSync(data.path); // convert the file data to a buffer

   const newFile = await Uploads.create({
        userId: req.userId,
        filename: data.filename,
        originalname : data.originalname,
        file:{
            data: fileBuffer,
            contentType: data.mimetype
        },
        path: data.path,
        size: data.size
    })

     fs.unlinkSync(req.file.path); // delete the file from the server after uploading to the database

    console.log('Uploaded file:', req.file);

    return res.status(200).json({ message: 'File uploaded successfully', file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        userId: req.userId,
        fileId : newFile._id,
        size: req.file.size
    } });

  } catch (err) {

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Only one file is allowed!' });
      }
      return res.status(400).json({ message: err.message });
    }

    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Server error', error: err });
  }
});

uploadRouter.get('/download/:id', async (req, res) => {
  try {
    const file = await Uploads.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set({
      'Content-Type': file.file.contentType,
      'Content-Disposition': `attachment; filename="${file.originalname}"`
    });

    res.send(file.file.data);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



export default uploadRouter;
























// To work with multer we need to know few things,
// 1. It adds a body parse to the request object, so we can access the file in req.file
// 2. all the text fields in the form will be available in req.body else will be availabe in req.file
// 3. we need to specify the storage location and the file name format
// 4. we can use the diskStorage to specify the storage location and the file name format
// 5. we need to specify the file filter function to filter the files based on the file type
