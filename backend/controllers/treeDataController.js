const fs = require("fs");
const path = require("path");

// Directory to check and create if missing
const EXPORTS_DIRECTORY = path.join(__dirname, "../exports");

/**
 * Ensures that the specified directory exists. If the directory does not exist,
 * it is created, including any necessary parent directories.
 *
 * @param {string} directoryPath - The path to the directory to check or create.
 * @throws {Error} If an error occurs while creating the directory.
 */
const ensureDirectoryExists = (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
        try {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log(`Directory created: ${directoryPath}`);
        } catch (error) {
            console.error(`Error creating directory ${directoryPath}:`, error);
            throw error;
        }
    }
};

// Temporary in-memory cache for the tree
let cachedTree = null;
let cachedPrunedTree = null;

// Path to the file for persistent storage
const SAFETY_CASE_FILE_PATH = path.join(EXPORTS_DIRECTORY, "safetyCaseData.json");
const PRUNED_SAFETY_CASE_FILE_PATH = path.join(EXPORTS_DIRECTORY, "prunedCaseData.json");

/**
 * Saves the provided safety case tree to a file and updates the in-memory cache.
 *
 * @param {Object} tree - The safety case tree object to save.
 * @throws {Error} If an error occurs while saving the tree.
 */
const saveSafetyCaseMarked = (tree) => {
    try {
        ensureDirectoryExists(EXPORTS_DIRECTORY); // Ensure directory exists

        // Clear the in-memory cache
        cachedTree = null;

        // Write the tree data to the file as JSON
        fs.writeFileSync(SAFETY_CASE_FILE_PATH, JSON.stringify(tree, null, 2), "utf-8");

        // Update the in-memory cache
        cachedTree = tree;

        console.log("Tree saved successfully.");
    } catch (error) {
        console.error("Error saving tree:", error);
        throw error;
    }
};

/**
 * Saves the provided pruned safety case tree to a file and updates the in-memory cache.
 *
 * @param {Object} tree - The pruned safety case tree object to save.
 * @throws {Error} If an error occurs while saving the tree.
 */
const savePrunedTree = (tree) => {
    try {
        ensureDirectoryExists(EXPORTS_DIRECTORY); // Ensure directory exists

        console.log("Trying to save pruned Tree.");

        // Write the tree data to the file as JSON
        fs.writeFileSync(PRUNED_SAFETY_CASE_FILE_PATH, JSON.stringify(tree, null, 2), "utf-8");

        console.log("Pruned Tree saved successfully.");
    } catch (error) {
        console.error("Error saving pruned tree:", error);
        throw error;
    }
};

/**
 * Retrieves the saved safety case tree from the file. If the file does not exist,
 * returns null. Updates the in-memory cache.
 *
 * @returns {Object|null} The safety case tree object, or null if no data exists.
 * @throws {Error} If an error occurs while retrieving the tree.
 */
const getSafetyCaseMarked = () => {
    try {
        ensureDirectoryExists(EXPORTS_DIRECTORY); // Ensure directory exists

        // Read the tree data from the file
        if (fs.existsSync(SAFETY_CASE_FILE_PATH)) {
            const fileData = fs.readFileSync(SAFETY_CASE_FILE_PATH, "utf-8");
            cachedTree = JSON.parse(fileData);
            console.log("Safety case loaded from file.");
            return cachedTree;
        }

        console.log("No Safety case data found.");
        return null; // No tree data available
    } catch (error) {
        console.error("Error retrieving tree:", error);
        throw error;
    }
};

/**
 * Retrieves the saved pruned safety case tree from the file. If the file does not exist,
 * returns null. Updates the in-memory cache.
 *
 * @returns {Object|null} The pruned safety case tree object, or null if no data exists.
 * @throws {Error} If an error occurs while retrieving the tree.
 */
const getPrunedSafetyCaseMarked = () => {
    try {
        ensureDirectoryExists(EXPORTS_DIRECTORY); // Ensure directory exists

        // Read the tree data from the file
        if (fs.existsSync(PRUNED_SAFETY_CASE_FILE_PATH)) {
            const fileData = fs.readFileSync(PRUNED_SAFETY_CASE_FILE_PATH, "utf-8");
            cachedPrunedTree = JSON.parse(fileData);
            console.log("Pruned safety case loaded from file.");
            return cachedPrunedTree;
        }

        console.log("No pruned safety case data found.");
        return null; // No tree data available
    } catch (error) {
        console.error("Error retrieving pruned tree:", error);
        throw error;
    }
};

// Export the functions
module.exports = {
    saveSafetyCaseMarked,
    getSafetyCaseMarked,
    savePrunedTree,
    getPrunedSafetyCaseMarked,
};
