import mongoose from 'mongoose';

export async function connectToDB() {
  if (!process.env.DATABASE)
    throw new Error("Couldn't find the database in the .env file.");
  await mongoose.connect(process.env.DATABASE);
}
