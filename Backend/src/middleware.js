export default function verifyToken(req,res,next){
    const token = req.headers['authorization'];
    if(!token) {
        return res.status(401).json({message: "No token provided"});
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message: "Invalid token"});
        }
        req.userId = decoded.id;
        next();
    }
    catch(err){
        return res.status(500).json({message: "Failed to authenticate token",error:err.message});
    }
}