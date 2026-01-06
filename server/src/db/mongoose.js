import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("MONGODB_URI missing - running WITHOUT Mongo (demo mode)");
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log("MongoDB connected");
}
