const fs = require('fs');

/**
 * Reads the contents of a file and returns it as a string.
 *
 * @function fileToString
 * @param {string} filePath - The path to the file to be read.
 * @returns {Promise<string>} A promise that resolves to the file's contents as a string.
 * @throws {Error} Rejects with an error if the file cannot be read.
 *
 * @example
 * fileToString('./example.txt')
 *     .then(data => console.log(data))
 *     .catch(err => console.error(err));
 */
const fileToString = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports = fileToString;
