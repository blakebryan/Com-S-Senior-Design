/**
 * @file server.js
 * The main entry point for the Express server. It sets up middleware, connects to the database, and handles API routing.
 */

const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware for enabling CORS
const connectDB = require('./config/database'); // Function to connect to MongoDB
const { exec } = require('child_process'); // Module for executing shell commands
const path = require('path'); // Module for handling file paths
const routes = require('./routes/apiRoutes'); // API routes
const app = express(); // Initialize the Express application

// Middleware for parsing JSON requests
app.use(express.json());

// Debug: log when the server starts up
console.log('Server starting up...');

// Enable CORS for all origins
app.use(cors({ origin: "*" }));

// Connect to MongoDB BEFORE using the routes
connectDB(); // Establish a connection to the MongoDB database

// Register API routes
app.use('/', routes);

// Serve static files for GSN SUAS
app.use('/gsn_suas', express.static(path.join(__dirname, '../gsn_suas'))); // Serve static files for GSN SUAS
app.use('/gsn_suas/images', express.static(path.join(__dirname, '../../gsn_suas/images'))); // Serve static images for GSN SUAS

// Define the port on which the server will run
const PORT = process.env.PORT || 8080;

/**
 * Start the server and listen on the specified port.
 * Logs a message indicating the server is running and accessible via localhost.
 */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
