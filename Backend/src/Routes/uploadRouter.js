import express from 'express';
import multer from 'multer';
import storage from '../utils/diskStorage.js';
import fileFilter from '../utils/filefilter.js';

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
uploadRouter.post('/', (req, res, next) => {

// Error handling for multer
  upload.single('excel')(req, res, function (err) {

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Only one file is allowed!' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Unknown server error', error: err });
    }



    if (!req.file) {
      return res.status(400).json({ message: 'pleas upload a file ' });
    }

    console.log('Uploaded file:', req.file);
    res.status(200).json({ message: 'File uploaded successfully' });

  });


});




export default uploadRouter;
























// To work with multer we need to know few things,
// 1. It adds a body parse to the request object, so we can access the file in req.file
// 2. all the text fields in the form will be available in req.body else will be availabe in req.file
// 3. we need to specify the storage location and the file name format
// 4. we can use the diskStorage to specify the storage location and the file name format
// 5. we need to specify the file filter function to filter the files based on the file type
