import mongoose, { mongo } from "mongoose"

export const connectDB= async () =>{
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL)
    console.log(`Mongod.b connected:${conn.connection.host}`)
  }
  catch(error){
    console.log("error in connecting to database:-",error)
  }
}
