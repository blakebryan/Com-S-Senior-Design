const { exec, spawn } = require('child_process');
const path = require('path');
const { processFileContent } = require('../utils/argsParser');
const { ArgumentTree } = require('../models/argumentTreeModel');
async function getSaveTreeAsSVG() {
    const module = await import('./safetyCaseGrapher.mjs');
    return module.saveTreeAsSVG;
}


/// Initialize an array to store mappings for printing at the end
let mappings = [];

/**
 * Parses the file and builds an argument tree.
 * @returns {Object} - The generated argument tree in JSON format.
 */
async function parseAndBuildArgumentTree(fileParseArgs) {
    try {
        const argData = await processFileContent(fileParseArgs);
        const argTree = new ArgumentTree();
        argTree.buildTree(argData);

        return argTree; // Return the instance, not the JSON representation
    } catch (error) {
        console.error("Error parsing and building argument tree:", error);
        throw error;
    }
}

/**
 * Recursively finds and returns all leaf nodes in the argument tree, with a "failed" property.
 * @param {Object} node - The current node in the argument tree.
 * @returns {Array} - An array of leaf nodes with a "failed" property set to false.
 */
function getLeafNodes(node) {
    if (node.children.length === 0) {
        return [{ ...node, failed: false }];
    }
    return node.children.flatMap(getLeafNodes);
}

/**
 * Synonyms dictionary
 */
const synonyms = {
    'gust': ['speed', 'gusts'],
    'gusts': ['gust', 'speed'],
    'speed': ['gust', 'velocity'],
    'wind': ['air'],
    'visibility': ['sight', 'view'],
    'max': ['maximum'],
    'min': ['minimum'],
    // Add more synonyms as needed
};

/**
 * Simple stemming function to reduce words to their base forms.
 * @param {string} word - The word to stem.
 * @returns {string} - The stemmed word.
 */
function stemWord(word) {
    // Remove 's' at the end of words longer than 3 characters
    if (word.length > 3 && word.endsWith('s')) {
        return word.slice(0, -1);
    }
    return word;
}

/**
 * Expands words with their synonyms.
 * @param {Array} words - The list of words to expand.
 * @returns {Array} - The expanded list of words.
 */
function expandWords(words) {
    const expandedWords = new Set(words);
    words.forEach(word => {
        if (synonyms[word]) {
            synonyms[word].forEach(syn => expandedWords.add(syn));
        }
    });
    return Array.from(expandedWords);
}

/**
 * Preprocesses a string: converts to lowercase, replaces underscores and hyphens, applies stemming, expands with synonyms, and splits into words.
 * @param {string} str - The string to preprocess.
 * @returns {Array} - An array of words.
 */
function preprocessString(str) {
    const words = str
        .toLowerCase()
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map(stemWord);

    return expandWords(words);
}

/**
 * Maps responses to leaf nodes in the argument tree using cosine similarity for best-fit matching.
 * Updates the global 'mappings' array.
 * @param {object} responses - The responses from the form submission.
 * @param {Array} leafNodes - The array of leaf nodes from the argument tree.
 */
async function mapResponsesToLeafNodes(responses, leafNodes) {
    console.log("\n\n\n\n[mapResponsesToLeafNodes]\n\n\n\n");
    console.log(responses);
    console.log("\n\n\n");
    console.log(leafNodes);
    
    //ensure the mappings are null so we do not append repeats!
    if(mappings != null){
        mappings = [];
    }

    const responseKeys = Object.keys(responses);

    // Preprocess response keys and include the entire response
    const preprocessedResponses = responseKeys.map(key => ({
        originalKey: key,
        originalValue: responses[key], // Include the response value
        words: preprocessString(key),
    }));

    // Extract and preprocess variable names from leaf nodes
    const leafNodeVariables = leafNodes.flatMap(node => {
        const variables = extractVariableNames(node.entity.description);
        return variables.map(variable => ({
            node,
            variable,
            words: preprocessString(variable),
        }));
    });

    // Build a vocabulary from all words
    const vocabularySet = new Set();
    preprocessedResponses.forEach(res => res.words.forEach(word => vocabularySet.add(word)));
    leafNodeVariables.forEach(varObj => varObj.words.forEach(word => vocabularySet.add(word)));
    const vocabulary = Array.from(vocabularySet);

    // For each response, find the best matching leaf node variable
    preprocessedResponses.forEach(response => {
        let bestMatch = null;
        let highestSimilarity = 0;

        leafNodeVariables.forEach(varObj => {
            const vectorA = getTermFrequencyVector(response.words, vocabulary);
            const vectorB = getTermFrequencyVector(varObj.words, vocabulary);
            const similarity = cosineSimilarity(vectorA, vectorB);

            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = varObj.node;
            }
        });

        // You can set a threshold for similarity if needed
        if (bestMatch && highestSimilarity > 0) {
            // Update the global mappings array
            mappings.push({
                response: response, // Save the entire response object
                bestMatch: bestMatch,
                score: highestSimilarity,
                // Remove 'failed' here; we'll access it directly from bestMatch when needed
            });
        }
    });
}

/**
 * Extracts variable names enclosed in square brackets from a description.
 * @param {string} description - The leaf node description.
 * @returns {Array} - An array of variable names.
 */
function extractVariableNames(description) {
    const regex = /\[([^\]]+)\]/g;
    const variables = [];
    let match;
    while ((match = regex.exec(description)) !== null) {
        variables.push(match[1]);
    }
    return variables;
}

/**
 * Generates a term frequency vector for a list of words given a vocabulary.
 * @param {Array} words - The list of words.
 * @param {Array} vocabulary - The vocabulary array.
 * @returns {Array} - The term frequency vector.
 */
function getTermFrequencyVector(words, vocabulary) {
    const freqMap = words.reduce((map, word) => {
        map[word] = (map[word] || 0) + 1;
        return map;
    }, {});

    return vocabulary.map(word => freqMap[word] || 0);
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param {Array} vecA - The first vector.
 * @param {Array} vecB - The second vector.
 * @returns {number} - The cosine similarity.
 */
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, val, idx) => sum + val * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Adjusts the failed status of each leaf node based on the response values.
 * @param {Array} mappings - The array of mappings between responses and leaf nodes.
 */
function adjustLeafNodeStatus(mappings) {
    mappings.forEach(mapping => {
        const responseValue = mapping.response.originalValue;
        const node = mapping.bestMatch;
        const nodeDesc = node.entity.description;

        let passValue = false;

        // Check if responseValue is 'true' or 'false' (boolean)
        if (typeof responseValue === 'string' && (responseValue.toLowerCase() === 'true' || responseValue.toLowerCase() === 'false')) {
            // Negate the boolean value for passValue
            const booleanValue = responseValue.toLowerCase() === 'true';
            passValue = !booleanValue;
        } else {
            // For text or numeric value, compare against the inequality in node description
            // Extract operator and expected value from nodeDesc
            const match = nodeDesc.match(/\[([^\]]+)\]\s*(<=|>=|<|>|==|=)\s*(.*)/);
            if (!match) {
                console.warn(`Unable to parse node description: ${nodeDesc}`);
                node.failed = true;
                return;
            }

            const operator = match[2];
            const expectedValueStr = match[3].trim();

            // Try to convert responseValue and expectedValueStr to numbers
            let actualValue = parseFloat(responseValue);
            let expectedValue = parseFloat(expectedValueStr);

            if (isNaN(actualValue) || isNaN(expectedValue)) {
                console.warn(`Unable to convert values to numbers: ${responseValue}, ${expectedValueStr}`);
                node.failed = true;
                return;
            }

            // Perform comparison
            let comparisonResult = false;
            switch (operator) {
                case '<':
                    comparisonResult = actualValue < expectedValue;
                    break;
                case '<=':
                    comparisonResult = actualValue <= expectedValue;
                    break;
                case '>':
                    comparisonResult = actualValue > expectedValue;
                    break;
                case '>=':
                    comparisonResult = actualValue >= expectedValue;
                    break;
                case '==':
                case '=':
                    comparisonResult = actualValue == expectedValue;
                    break;
                default:
                    console.warn(`Unsupported operator: ${operator}`);
                    node.failed = true;
                    return;
            }

            // Negate the comparison result for passValue
            passValue = !comparisonResult;
        }

        // Set the node's failed status based on passValue
        node.failed = passValue;

        console.log(`Updated node "${nodeDesc}" with response "${mapping.response.originalKey}: ${responseValue}" - Failed: ${node.failed}`);
    });
}




async function mapResponseToGoal(response, fileParseArgs) {
    console.log("resp => goal");
    console.log(response);

    try {
        const tree = await parseAndBuildArgumentTree(fileParseArgs);
        console.log("Generated argument tree:", tree);

        // Pass the root node of the tree to getLeafNodes
        const leafNodes = getLeafNodes(tree.rootNode);
        console.log("\n\nLeaf nodes (nodes with no children):", leafNodes);
        console.log("Responses!", response);


        await mapResponsesToLeafNodes(response, leafNodes);

        // Define your constants
        const constants = {
            max_wind_speed: 20,
            min_visibility: 145,
            // Add other constants as needed
        };

        // Adjust leaf node status based on response values
        adjustLeafNodeStatus(mappings, constants);

        // Collect failed mappings
        const failedMappings = mappings.filter(mapping => mapping.bestMatch.failed);

        // Print all mappings at the end
        console.log("\n\nMappings:");
        mappings.forEach(mapping => {
            console.log(`Response Key: ${mapping.response.originalKey}`);
            console.log(`Response Value: ${mapping.response.originalValue}`);
            console.log(`Best Match: ${mapping.bestMatch.entity.description}`);
            console.log(`Score: ${mapping.score}`);
            console.log(`Failed: ${mapping.bestMatch.failed}`);
            console.log("-------------------------");
        });

        // Print only the failed mappings
        console.log("\n\nFailed Mappings:");
        failedMappings.forEach(failedMapping => {
            console.log(`Response Key: ${failedMapping.response.originalKey}`);
            console.log(`Response Value: ${failedMapping.response.originalValue}`);
            console.log(`Best Match: ${failedMapping.bestMatch.entity.description}`);
            console.log(`Score: ${failedMapping.score}`);
            console.log(`Failed: ${failedMapping.bestMatch.failed}`);
            console.log("-------------------------");
        });

        failedMappings.forEach(failedMapping => {
            const failedNode = tree.findNodeById(failedMapping.bestMatch.entity.id);
            if (failedNode) {
                tree.failTree(failedNode);
            }
        });

        // Print final tree structure with failures
        console.log("Final Argument Tree with Failures:");
        console.log(tree.toJSON())
        tree.printTree();
        // Dynamically import and call `saveTreeAsSVG` function

        try 
        {
            const saveTreeAsSVG = await getSaveTreeAsSVG();
            saveTreeAsSVG(tree);
        }

        catch(error)
        {
            console.error("Failed to save tree: ", error);
            return tree;
        }

        return tree;
    } catch (error) {
        console.error("Error in mapResponseToGoal:", error);
    }
}


module.exports = {
    mapResponseToGoal,
    adjustLeafNodeStatus
};


