import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import multer from "multer";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body

    try {
        if(!fullName || !email || !password){
            return res.status(400).json({ message: "All fields are required" });

        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
      
        const user = await User.findOne({ email })
        if (user) return res.status(400).json({ message: "Email already exists" });
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })
        if (newUser) {
            generateToken(newUser._id, res)
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            })
        } else {
            res.status(400).json({ message: "Invalid user data" })
        }
    }
    catch (error) {
        console.log("error in signup controller", error.message)
        res.status(500).json({ message: "Iternal server error" })
    }
}
export const login = async (req, res) => {
    const {email,password} = req.body

    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"Invalid credntials"});
        }
        const isPasswordCorrrect = await bcrypt.compare(password,user.password)
        if(!isPasswordCorrrect){
            return res.status(400).json({message:"Invalid credntials"});
        }
        generateToken(user._id,res)

        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        })
    }catch(error){
        console.log("error in login controller",error.message);
        res.status(500).json({message:"Invalid credntials"});

    }

}
export const logout = (req, res) => {
try{
  res.cookie("jwt","",{maxAge:0})  
  res.status(200).json({message:"Logged out succefully"});

}catch(error){
    console.log("error in logout controller",error.message);
    res.status(500).json({message:"internal server error"});

}
}

export const updateProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }
    // Convert file buffer to base64 string (Cloudinary accepts data URIs)
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResponse = await cloudinary.uploader.upload(fileStr);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json({ updatedUser });
  } catch (error) {
    console.log("Error in update-profile controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};






export const checkAuth=(req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("error in checkAuth controller",error.message);
    res.status(500).json({message:"Internal server error"});

    }
}