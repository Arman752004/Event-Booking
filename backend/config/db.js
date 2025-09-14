const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://armanpanda1617_db_user:2sDGxqy4gGXy4J0L@eventcluster.bzjpmgd.mongodb.net/eventbooking?retryWrites=true&w=majority&appName=EventCluster"
    );
    console.log("✅ MongoDB Connected...");
  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

