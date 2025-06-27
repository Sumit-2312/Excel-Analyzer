import express from 'express';
import { Uploads, Users } from '../db';
const adminRouter = express.Router();

// admin should have access to all the users uploads and should be able to delete any upload or block user

adminRouter.post('/block',async(req,res)=>{
    const userId = req.userId;
    try{
        const user = await Users.findById(userId);
        if(!user) return res.status(404).json({message: "Admin user not found"});
        if( user.role !== 'admin' ) return res.status(403).json({message: "Access denied for this role"});
        const {email} = req.body;
        if(!email) return res.status(400).json({message: "Email is required"});

        const deletedUser = await Users.findOneAndDelete({email});
        if(!deletedUser) return res.status(404).json({message: "User not found or maybe blocked already"});

        return res.status(200).json({message: "User blocked successfully", user: deletedUser});
    }catch(err){
        console.error('Error blocking user:', err);
        return res.status(500).json({message: "Internal server error", error: err.message});
    }
})


// route to get all uploads of a user by their email
adminRouter.get('/uploads/:email',async(req,res)=>{
    const userId = req.userId;
    const email = req.params.email;
    try{
        const user = await Users.findById(userId);
        if(!user) return res.status(404).json({message: "Admin user not found"});
        if( user.role !== 'admin' ) return res.status(403).json({message: "Access denied for this role"});

        const uploads = await Uploads.find({email}).sort({uploadDate: 1}); // 1 for ascending order means the oldest file will be first
        if(!uploads || uploads.length === 0) return res.status(404).json({message: "No uploads found for this user"});

        return res.status(200).json({message: "Uploads fetched successfully", uploads});    
    }catch(err){
        console.error('Error fetching uploads:', err);
        return res.status(500).json({message: "Internal server error", error: err.message});
    }
})

// route to delete a specific upload by its id
adminRouter.delete('/uploads/:id',async(req,res)=>{
    const userId = req.userId;
    const uploadId = req.params.id;
    try{
        const user = await Users.findById(userId);
        if(!user) return res.status(404).json({message: "Admin user not found"});
        if( user.role !== 'admin' ) return res.status(403).json({message: "Access denied for this role"});

        const upload = await Uploads.findByIdAndDelete(uploadId);
        if(!upload) return res.status(404).json({message: "Upload not found"});

        return res.status(200).json({message: "Upload deleted successfully", upload});
    }catch(err){
        console.error('Error deleting upload:', err);
        return res.status(500).json({message: "Internal server error", error: err.message});
    }
});

// route to get first 10 users
// request will come like /users/?page=1&limit=10
adminRouter.get('/users',async(req,res)=>{
    try {
    const page = parseInt(req.query.page) || 1;       
    const limit = parseInt(req.query.limit) || 10;     
    const skip = (page - 1) * limit;

    const users = await Users.find({}).skip(skip).limit(limit).select('-password'); 

    const total = await Users.countDocuments();

    res.json({
      users,
      total,
      hasMore: skip + users.length < total,
      nextPage: page + 1
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



export default adminRouter;