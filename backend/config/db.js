const mongoose = require('mongoose');
const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log("MongoDB connected");
    }).catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });
}

module.exports = connectDB;