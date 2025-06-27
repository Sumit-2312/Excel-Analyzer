import express from 'express';
import multer from 'multer';
import storage from '../utils/diskStorage.js';
import fileFilter from '../utils/filefilter.js';
import { Uploads, Users } from '../db.js';
import fs from 'fs';
import cloudinary from '../utils/cloudinary.js';


const uploadRouter = express.Router();


// Multer configuration
const upload = multer({
    storage : storage,
    fileFilter: fileFilter,
    limits: {
        fileSize : 1024 * 1024 * 1 // 1 MB file size limit
    }
});



// All these request will be handled by the middleware before reaching to this point
// so we will assume that the user is authenticated and userId is available in req.userId
// to upload the file in the expre ss server , we need the multer package


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



    const result = await cloudinary.uploader.upload(data.path,{
      resource_type: 'raw'
    });



   const newFile = await Uploads.create({
        userId: req.userId,
        filename: data.filename,
        originalname : data.originalname,
        fileUrl : result.secure_url,
        size: data.size
    })

    fs.unlinkSync(data.path); // delete the file from the server after uploading to cloudinary


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

// returned all files with their url, when we click/redirect on url , file will be downloaded
uploadRouter.get('/',async(req,res)=>{

  try{
    const user = await Users.findById(req.userId);
    if(!user) return res.status(404).json({message: "User not found"});

    const files = await Uploads.find({userId: req.userId}).sort({uploadDate: 1}); // 1 for ascending order means the oldest file will be first

    res.status(200).json({
      message: "Files fetched successfully",
      files: files
    })
  }catch(err){
    console.error('Error fetching files:', err);
    return res.status(500).json({ message: 'Server error', error: err });
  }

})


export default uploadRouter;
























// To work with multer we need to know few things,
// 1. It adds a body parse to the request object, so we can access the file in req.file
// 2. all the text fields in the form will be available in req.body else will be availabe in req.file
// 3. we need to specify the storage location and the file name format
// 4. we can use the diskStorage to specify the storage location and the file name format
// 5. we need to specify the file filter function to filter the files based on the file type
