/**
 * @file json_xml_to_yaml.js
 * Updates a YAML template using user responses stored in MongoDB.
 * @author Brady Bargren. ISU ID: az2997
 */

const fs = require('fs');
const yaml = require('js-yaml');
const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection setup
mongoose.connect('mongodb://localhost:27017/safety_case');

/**
 * MongoDB schema and model for user responses.
 * Each response consists of a question name, the question text, and the answer provided by the user.
 */
const responseSchema = new mongoose.Schema({
    questionName: String,
    questionText: String,
    answer: String
});
const Response = mongoose.model('Response', responseSchema);

/**
 * Fetches all user responses from MongoDB.
 *
 * @returns {Promise<Array>} A promise that resolves with an array of user responses.
 */
const loadResponsesFromDB = () => {
    return Response.find({}).exec();
};

/**
 * Loads a YAML template from a specified file path.
 *
 * @param {string} templatePath - The path to the YAML template file.
 * @returns {Object} The parsed YAML content as a JavaScript object.
 * @throws Will throw an error if the file cannot be read or parsed.
 */
const loadYamlTemplate = (templatePath) => {
    try {
        const fileContent = fs.readFileSync(templatePath, 'utf8');
        return yaml.load(fileContent);
    } catch (err) {
        console.error('Error reading YAML template:', err);
        throw err;
    }
};

/**
 * Removes unsupported solution nodes (Sn) based on user input.
 *
 * @param {Object} yamlContent - The YAML content to be updated.
 * @param {string} featureKey - The key of the feature node being processed.
 * @param {string} selectedOptionSn - The Sn node corresponding to the user's selected answer.
 * @param {Array<string>} allSn - An array of all possible Sn nodes for this feature.
 */
const removeUnsupportedSn = (yamlContent, featureKey, selectedOptionSn, allSn) => {
    yamlContent[featureKey].supportedBy = [selectedOptionSn];

    allSn.forEach(sn => {
        if (sn !== selectedOptionSn && yamlContent[sn]) {
            delete yamlContent[sn]; // Remove unselected Sn options from the YAML
        }
    });
};

/**
 * Updates the YAML structure using user responses.
 * Selects relevant solution nodes (Sn) based on user input and removes unsupported options.
 *
 * @param {Object} yamlContent - The YAML content to be updated.
 * @param {Array<Object>} jsonResponses - An array of user responses from MongoDB.
 * @returns {Object} The updated YAML content.
 */
const updateYamlWithResponses = (yamlContent, jsonResponses) => {
    jsonResponses.forEach(response => {
        switch (response.questionName) {
            case 'Flight_Hours':
                removeUnsupportedSn(yamlContent, 'S1', response.answer === 'LessThan_N' ? 'Sn2' : response.answer === 'BetweenNplus1AndM' ? 'Sn3' : 'Sn4', ['Sn2', 'Sn3', 'Sn4']);
                break;

            case 'Simulation_Hours':
                removeUnsupportedSn(yamlContent, 'S2', response.answer === 'None' ? 'Sn5' : 'Sn6', ['Sn5', 'Sn6']);
                break;

            case 'Adverse_Experience':
                removeUnsupportedSn(yamlContent, 'S3', response.answer === 'none' ? 'Sn7' : response.answer === 'one' ? 'Sn8' : 'Sn9', ['Sn7', 'Sn8', 'Sn9']);
                break;

            case 'Purpose':
                removeUnsupportedSn(yamlContent, 'S4', response.answer === 'Recreation' ? 'Sn14' : response.answer === 'SearchRescue' ? 'Sn15' : 'Sn16', ['Sn14', 'Sn15', 'Sn16']);
                break;

            case 'Hardware':
                removeUnsupportedSn(yamlContent, 'S5', response.answer === 'x' ? 'Sn17' : response.answer === 'y' ? 'Sn18' : 'Sn19', ['Sn17', 'Sn18', 'Sn19']);
                break;

            case 'BatteryReserve':
                removeUnsupportedSn(yamlContent, 'S6', response.answer === 'Insufficient' ? 'Sn20' : 'Sn21', ['Sn20', 'Sn21']);
                break;

            case 'Wind_Gusts':
                removeUnsupportedSn(yamlContent, 'S7', response.answer === 'w_Yes' ? 'Sn22' : 'Sn23', ['Sn22', 'Sn23']);
                break;

            case 'PoorVisibility':
                removeUnsupportedSn(yamlContent, 'S8', response.answer === 'P_Yes' ? 'Sn24' : 'Sn25', ['Sn24', 'Sn25']);
                break;

            case 'Precipitation':
                removeUnsupportedSn(yamlContent, 'S9', response.answer === 'r_Yes' ? 'Sn26' : 'Sn27', ['Sn26', 'Sn27']);
                break;

            case 'FreezingTemps':
                removeUnsupportedSn(yamlContent, 'S10', response.answer === 'F_Yes' ? 'Sn28' : 'Sn29', ['Sn28', 'Sn29']);
                break;

            case 'Certifications':
                removeUnsupportedSn(yamlContent, 'G10', response.answer === 'CertOne' ? 'Sn10' : response.answer === 'CertTwo' ? 'Sn11' : 'Sn12', ['Sn10', 'Sn11', 'Sn12']);
                break;

            // Handle more cases as needed
        }
    });

    // Remove the self-referencing issue for Sn13
    if (yamlContent.Sn13 && yamlContent.Sn13.supportedBy) {
        delete yamlContent.Sn13.supportedBy; // Remove the invalid reference for Sn13
    }

    return yamlContent;
};

/**
 * Writes the updated YAML content to a specified file.
 *
 * @param {Object} updatedYaml - The updated YAML content.
 * @param {string} outputPath - The path to the output file.
 */
const writeUpdatedYaml = (updatedYaml, outputPath) => {
    try {
        const yamlString = yaml.dump(updatedYaml);
        fs.writeFileSync(outputPath, yamlString, 'utf8');
        console.log(`YAML file successfully updated at ${outputPath}`);
    } catch (err) {
        console.error('Error writing YAML file:', err);
        throw err;
    }
};

/**
 * Main function to update a YAML file using user responses stored in MongoDB.
 *
 * @param {string} templatePath - The path to the YAML template file.
 * @param {string} outputPath - The path to the output YAML file.
 */
const updateYamlFileWithMongoData = async (templatePath, outputPath) => {
    try {
        const yamlTemplate = loadYamlTemplate(templatePath);   // Load the YAML template
        const jsonResponses = await loadResponsesFromDB();     // Fetch responses from MongoDB

        // Apply user data, then remove unused options
        const updatedYaml = updateYamlWithResponses(yamlTemplate, jsonResponses);
        writeUpdatedYaml(updatedYaml, outputPath);  // Write the updated YAML back
    } catch (err) {
        console.error('Error during YAML update:', err);
    } finally {
        mongoose.connection.close();  // Close the MongoDB connection after the process is complete
    }
};

// Paths to template YAML and output YAML files
const templateYamlPath = path.join(__dirname, 'templates', 'suas_template.gsn.yaml');
const outputYamlPath = path.join(__dirname, 'images', 'suas.gsn.yaml');

// Call the main function
updateYamlFileWithMongoData(templateYamlPath, outputYamlPath);

module.exports = {
    loadResponsesFromDB,
    loadYamlTemplate,
    removeUnsupportedSn,
    updateYamlWithResponses,
    writeUpdatedYaml,
    updateYamlFileWithMongoData,
};
