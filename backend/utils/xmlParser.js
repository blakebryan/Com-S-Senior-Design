const fs = require('fs');
const xml2js = require('xml2js');

/**
 * Parses an XML file and converts it to a JavaScript object.
 *
 * @function
 * @param {string} filePath - The path to the XML file to be parsed.
 * @returns {Promise<Object>} - A promise that resolves to the JavaScript object representation of the XML file,
 * or rejects with an error if the file cannot be read or parsed.
 *
 * @example
 * parseXMLToJS('path/to/file.xml')
 *   .then(data => {
 *     console.log('Parsed XML:', data);
 *   })
 *   .catch(error => {
 *     console.error('Error parsing XML:', error);
 *   });
 */
const parseXMLToJS = (filePath) => {
    return new Promise((resolve, reject) => {
        // Read the XML file
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                // Reject promise if file read fails
                reject(err);
            } else {
                // Parse XML data to JS object
                const parser = new xml2js.Parser({ explicitArray: false });
                parser.parseString(data, (err, result) => {
                    if (err) {
                        // Reject promise if parsing fails
                        reject(err);
                    } else {
                        // Resolve promise with parsed object
                        resolve(result);
                    }
                });
            }
        });
    });
};

// Export the parseXMLToJS function
module.exports = parseXMLToJS;
