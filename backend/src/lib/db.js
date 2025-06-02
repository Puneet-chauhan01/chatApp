import mongoose, { mongo } from "mongoose"
import dotenv from "dotenv"
dotenv.config();
export const connectDB= async () =>{
  try {
    let url = process.env.MONGO_URL
  if (!url) {
      throw new Error("MONGO_URL is not defined in environment variables");
    }
    const conn = await mongoose.connect(url)
    console.log(`Mongod.b connected:${conn.connection.host}`)
  }
  catch(error){
    console.log("error in connecting to database:-",error)
  }
}
