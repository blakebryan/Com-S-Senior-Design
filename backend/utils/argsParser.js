/**
 * This module is responsible for:
 * - Reading the input file containing GSN arguments
 * - Tokenizing the content of the file
 * - Creating structures (such as Goals, Strategies, Solutions, etc.)
 */

const fileToString = require('./argReader');
const { matchToken, ArgTokens } = require('./argsTokens');
const { Goal, Strategy, Solution, Context, IsSupportedBy, InContextOf, ArgData } = require('./ArgStructs');
const {
    parseGoal,
    parseStrategy,
    parseSolution,
    parseContext,
    parseIsSupportedBy,
    parseInContextOf
} = require('./argsGrammar'); // Parsers for grammar rules

/**
 * Reads the file content from the specified file path.
 * @param {string} filePath - The path to the file to be read.
 * @returns {Promise<string | undefined>} - Resolves with the file content as a string or `undefined` if an error occurs.
 */
const getFileContent = async (filePath) => {
    try {
        const fileContent = await fileToString(filePath);
        return fileContent;
    } catch (error) {
        console.error('Error reading the file:', error);
        return undefined;
    }
};

/**
 * Tokenizes the given file content.
 * @param {string} fileContent - The content of the file as a string.
 * @returns {{matchedTokens: string[], tokens: string[]}} - An object containing matched tokens and their raw counterparts.
 */
const tokenizeFileContent = (fileContent) => {
    const matchedTokens = [];
    const tokens = [];

    const regex = new RegExp(
        `\\b(Goal|Strategy|Solution|Context|IsSupportedBy|InContextOf|toBeDeveloped|description|to|from)\\b|` +
        `[{}:]|` +
        `"(?:[^"\\\\]|\\\\.)*"|` +
        `\\[[^\\]]*\\]|` +
        `[^"\\s{}:]+`,
        "g"
    );

    let match;
    while ((match = regex.exec(fileContent)) !== null) {
        const token = match[0];
        tokens.push(token);
        const matchedToken = matchToken(token); // Process the matched token
        matchedTokens.push(matchedToken);
    }
    return { matchedTokens, tokens };
};

/**
 * Processes the file content and builds argument structures from tokens.
 * @param {string} filePath - The path to the file to be processed.
 * @returns {Promise<ArgData>} - Resolves with the constructed ArgData instance containing parsed entities.
 */
const processFileContent = async (filePath) => {
    const argData = new ArgData(); // Create a new ArgData instance for each processing.
    const fileContent = await getFileContent(filePath); // Read the file content

    if (fileContent) {
        const result = tokenizeFileContent(fileContent); // Tokenize the content

        const matchedTokens = result.matchedTokens;
        const tokens = result.tokens;

        // Process tokens sequentially
        while (matchedTokens.length > 0) {
            let currentToken = matchedTokens.shift(); // Current matched token
            tokens.shift(); // Corresponding raw token

            if (currentToken === ArgTokens.GOAL) {
                const { success, data } = parseGoal(matchedTokens, tokens);
                if (success && data) argData.goals.push(data);
            } else if (currentToken === ArgTokens.STRATEGY) {
                const { success, data } = parseStrategy(matchedTokens, tokens);
                if (success && data) argData.strategies.push(data);
            } else if (currentToken === ArgTokens.SOLUTION) {
                const { success, data } = parseSolution(matchedTokens, tokens);
                if (success && data) argData.solutions.push(data);
            } else if (currentToken === ArgTokens.CONTEXT) {
                const { success, data } = parseContext(matchedTokens, tokens);
                if (success && data) argData.contexts.push(data);
            } else if (currentToken === ArgTokens.IS_SUPPORTED_BY) {
                const { success, data } = parseIsSupportedBy(matchedTokens, tokens);
                if (success && data) argData.isSupportedByRelations.push(data);
            } else if (currentToken === ArgTokens.IN_CONTEXT_OF) {
                const { success, data } = parseInContextOf(matchedTokens, tokens);
                if (success && data) argData.inContextOfRelations.push(data);
            }
        }
    }

    return argData; // Return the constructed argument data
};

module.exports = { processFileContent };
