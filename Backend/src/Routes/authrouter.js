import express from 'express';
import { Users } from '../db.js';
import bcrypt from 'bcrypt';
const authRouter = express.Router();

authRouter.post('/signup',async (req,res)=>{

    const {username,password,email,role} = req.body;
    if(!username || !password || !email || !role){
        return res.status(400).json({message: "All fields are required"});
    }

    try{
        const user = await Users.find({email});
        if(user) return res.status(400).json({message: "User already exists"});
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Users.create({
            username,
            password: hashedPassword,
            email,
            role
        });
        return res.status(201).json({message: "User created successfully", user: newUser});
    }
    catch(err){
        return res.status(500).json({message: "Internal server error", error: err.message});
    }

})

authRouter.post("/login",async(req,res)=>{
    const {email,password,role} = req.body;
    if(!email || !password || !role){
        return res.status(400).json({message: "All fields are required"});
    }
    try{
        const user = await Users.findOne({email});
        if(!user) return res.status(400).json({message: "User does not exist"});
        if( user.role !== role ) return res.status(403).json({message: "Access denied for this role"});
        const isMatch = await bcrypt.compare(password, user.password);              
        if(!isMatch) return res.status(400).json({message: "Invalid password"});
        return res.status(200).json({message: "Login successful", user});
    }
    catch(err){
        return res.status(500).json({message: "Internal server error", error: err.message});
    }
})


export default authRouter;