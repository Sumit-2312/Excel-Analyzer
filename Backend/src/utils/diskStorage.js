import multer from 'multer';
import path from 'path';

// this contains two functions( destination and filename) which will be used to specify the storage location and the file name format
 const storage = multer.diskStorage({
  destination: (req,file,callback)=>{
    // we get access to the request object and the file object that contains the file information
    callback(null,'./src/uploads'); // this is the folder where the file will be stored
  },
  filename: (req,file,callback)=>{
    // this will specify what will be the name of the file when it is stored in the uploads folder
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // this will generate a unique suffix for the file name
    callback(null, file.fieldname + '-' + uniqueSuffix + '.' +  path.extname(file.originalname)); // this will create a file name like 'file-1234567890.xlsx'
  }
});


export default storage;