import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb://${process.env.DOCKER_DB_USERNAME}:${process.env.DOCKER_DB_PASSWORD}@localhost:27017/${process.env.DOCKER_DB_NAME}?authSource=admin`);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Error:', error);
  }
};

export default connectDB;
