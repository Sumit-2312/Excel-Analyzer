import path from 'path';

const fileFilter = (req,file,callback)=>{
    const extension = path.extname(file.originalname).toLowerCase();

    const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel';

    if( (extension === '.xlsx' || extension === '.xls' ) && mimetype ){
        callback(null,true); // accept the file and store in the uploads folder
    }
    else {
        callback(new Error('Only .xlsx and .xls files are allowed'), false); // reject the file with an error message
    }
}

export default fileFilter;