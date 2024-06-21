import data from './config.js';
import jwt from 'jsonwebtoken';
export default function authMiddleware(req,res,next){
    const authHeader=req.headers.authorization;
    // console.log(authHeader);
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(403).json({
            message:"Invalid auth 1"
        })
    }
    const token=authHeader.split(' ')[1];
    try{
        const decoded=jwt.verify(token,data.JWT_SECRET);
        if(decoded.userId){
            req.userId=decoded.userId;
            next();
        }
        else{
        return res.status(403).json({message:"Invalid auth 2"});
        }

    }catch(error){
        return res.status(403).json({message:"Invalid auth 3" });
    }
}