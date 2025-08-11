import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_inventory';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
}

export async function disconnectDB() {
  await mongoose.connection.close(false);
}

export function dbState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState;
}
