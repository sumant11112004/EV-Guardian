const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Only use in-memory if no URI or it literally contains USERNAME placeholder
    const isPlaceholder = !uri || uri.includes('USERNAME:PASSWORD') || uri.includes('<username>');
    if (isPlaceholder) {
      console.log('⚠️  No real MongoDB URI detected — starting in-memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log('✅ In-memory MongoDB started (data resets on restart)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
  process.exit(0);
});

module.exports = connectDB;
