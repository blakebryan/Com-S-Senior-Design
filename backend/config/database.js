const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Establishes a connection to the MongoDB database.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when the connection is established successfully.
 * @throws {Error} Throws an error if the connection to MongoDB fails.
 *
 * @description
 * This function connects to the MongoDB instance using the URI provided in the
 * environment variable `MONGO_URI`. If the connection fails, it logs the error
 * and terminates the process with an exit code of 1.
 */
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit the process if the connection fails
    }
};

// Export the connectDB function for external use
module.exports = connectDB;

// Log the MongoDB URI for debugging purposes (ensure this doesn't expose sensitive information in production)
console.log('MongoDB URI:', process.env.MONGO_URI);
