/**
 * @file updateThresholds.js
 * This script reads threshold data for drones from a CSV file and updates the database with the parsed data.
 * It connects to the database, parses the CSV file, and uses the `setThresholdsFor` function to update thresholds.
 */

const { exit } = require('process'); // Provides functionality to exit the Node.js process
const { getThresholds, setThresholdsFor, deleteThreshold } = require('./models/threshold.js'); // Database operations for thresholds
const connectDB = require('./config/database.js'); // Function to connect to MongoDB
const fs = require('fs'); // File system module for reading files
const path = require('path'); // Path module for working with file and directory paths

// Connect to the database
connectDB();

console.log("Starting procedure");

/**
 * Main execution block
 * - Reads the CSV file containing threshold data.
 * - Parses the data and updates the database with threshold values.
 */
(async () => {
    let promises = []; // Array to store promises for database updates

    // Path to the CSV file
    const filePath = path.join(__dirname, 'files/drone_make_and_model.csv');

    // Read the CSV file asynchronously
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        // Parse the CSV data into JSON format
        const parsedData = parseCSV(data);

        // Iterate over parsed data and create database update promises
        parsedData.forEach((item) => {
            promises.push(
                setThresholdsFor(
                    Object.values(item)[0], // Drone identifier
                    {
                        maxWind: item.Max_Wind_Speed,
                        maxDensity: item.Max_Density_Alt,
                        maxWeight: item['Max_Takeoff_Weight']
                    }
                )
            );
        });
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    console.log("Procedure finished");
    exit(0); // Exit the Node.js process
})();

/**
 * Parses CSV data into a JSON object.
 *
 * @param {string} data - The CSV file content as a string.
 * @returns {Array<Object>} An array of objects representing the parsed CSV data.
 */
function parseCSV(data) {
    // Normalize line endings for Windows-formatted files
    data = data.replaceAll('\r', '');

    const lines = data.split('\n'); // Split CSV content into lines
    const headers = lines[0].split(','); // Extract headers from the first line
    const result = []; // Array to store parsed objects

    // Iterate over each line and map values to headers
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = lines[i].split(',');

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j]; // Map each value to its corresponding header
        }
        result.push(obj); // Add the object to the result array
    }
    return result; // Return the parsed data
}
