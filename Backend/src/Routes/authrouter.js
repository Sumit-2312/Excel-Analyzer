import express from 'express';
import { Blocked, Users } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const authRouter = express.Router();

// if the user is blocked , we will not allow them to either signup or login
// for the future req we don't need to check if the user is blocked or not

authRouter.post('/signup',async (req,res)=>{

    const {username,password,email,role} = req.body;
    if(!username || !password || !email || !role){
        return res.status(400).json({message: "All fields are required"});
    }

    try{
        const user = await Users.findOne({email});
        if(user) return res.status(400).json({message: "User already exists"});
        const isBlocked = await Blocked.findOne({email});
        if(isBlocked && isBlocked.blocked) return res.status(403).json({message: "Your email is blocked, please use different one"}); 
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Users.create({
            username,
            password: hashedPassword,
            email,
            role
        })
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

        const isBlocked = await Blocked.findOne({email});
        if(isBlocked && isBlocked.blocked) return res.status(403).json({message: "Your email is blocked, please use different one"});

        if( user.role !== role ) return res.status(403).json({message: "Access denied for this role"});
        const isMatch = await bcrypt.compare(password, user.password);              
        if(!isMatch) return res.status(400).json({message: "Invalid password"});

        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn: '7d'});

        return res.status(200).json({message: "Login successful",user: {id: user._id, username: user.username, email:user.email, role: user.role}, token: token});
    }
    catch(err){
        return res.status(500).json({message: "Internal server error", error: err.message});
    }
})

export default authRouter;