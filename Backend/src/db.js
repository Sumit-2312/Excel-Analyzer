import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const userSchema = new Schema({
    username: { type : String, required: true, unique: true , min:[3,"Minimum length of name should be 3"] , max:[20,"Max length of name should be 20"] },
    password: {type: String, required: true, min:[6,"Minimum length of password should be 6"] , max:[20,"Max length of password should be 20"]},
    email: { type: String, required: true, unique: true},
    role: {type: String , required: true, enum :['admin','user'], default: 'user'}
})

export const Users = mongoose.model('Users', userSchema);


