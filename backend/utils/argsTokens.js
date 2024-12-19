/**
 * This module defines the tokens used in parsing argument structures and provides
 * a helper function to match strings to their corresponding tokens.
 */

// Define argument tokens as a constant object
const ArgTokens = {
    // Argument Tokens
    ARGUMENT: "ARGUMENT",
    ARG_NAME: "ARG_NAME",

    // Goal Tokens
    GOAL: "GOAL",
    GOAL_NAME: "GOAL_NAME",
    GOAL_DESCRIPTION: "GOAL_DESCRIPTION",
    GOAL_TO_BE_DEVELOPED: "GOAL_TO_BE_DEVELOPED",

    // Strategy Tokens
    STRATEGY: "STRATEGY",
    STRATEGY_NAME: "STRATEGY_NAME",
    STRATEGY_DESCRIPTION: "STRATEGY_DESCRIPTION",

    // Solution Tokens
    SOLUTION: "SOLUTION",
    SOLUTION_NAME: "SOLUTION_NAME",
    SOLUTION_DESCRIPTION: "SOLUTION_DESCRIPTION",

    // Context Tokens
    CONTEXT: "CONTEXT",
    CONTEXT_NAME: "CONTEXT_NAME",
    CONTEXT_DESCRIPTION: "CONTEXT_DESCRIPTION",

    // IsSupportedBy Tokens
    IS_SUPPORTED_BY: "IS_SUPPORTED_BY",
    IS_SUPPORTED_BY_NAME: "IS_SUPPORTED_BY_NAME",

    // InContextOf Tokens
    IN_CONTEXT_OF: "IN_CONTEXT_OF",
    IN_CONTEXT_OF_NAME: "IN_CONTEXT_OF_NAME",

    // General Tokens
    DESCRIPTION: "DESCRIPTION",
    RELATION_TO: "RELATION_TO",
    RELATION_FROM: "RELATION_FROM",

    // Other Tokens
    DIGIT: "DIGIT",           // Represents any digit (0-9)
    STRING: "STRING",         // Represents any string within double quotes
    L_BRACE: "L_BRACE",       // Represents opening brace '{'
    R_BRACE: "R_BRACE",       // Represents closing brace '}'
    QUOTE: "QUOTE",           // Represents a quotation mark (")
    COLON: "COLON"            // Represents a colon ':'
};

// A flag to track if we expect an argument name after 'Argument' and 'DIGIT'
let expectingArgumentName = false;

/**
 * Matches a given token string to its corresponding `ArgTokens` value.
 *
 * @param {string} token - The string token to match.
 * @returns {string} - The corresponding `ArgTokens` value or the token itself if unmatched.
 */
const matchToken = (token) => {
    // If we are expecting an argument name, handle it and reset the flag
    if (expectingArgumentName) {
        expectingArgumentName = false;  // Reset the flag
        return ArgTokens.ARG_NAME;  // Treat as argument name
    }

    switch (token) {
        // Keywords
        case 'Argument':
            expectingArgumentName = true; // Set the flag for the next token
            return ArgTokens.ARGUMENT;
        case 'Goal':
            return ArgTokens.GOAL;
        case 'Strategy':
            return ArgTokens.STRATEGY;
        case 'Solution':
            return ArgTokens.SOLUTION;
        case 'Context':
            return ArgTokens.CONTEXT;
        case 'IsSupportedBy':
            return ArgTokens.IS_SUPPORTED_BY;
        case 'InContextOf':
            return ArgTokens.IN_CONTEXT_OF;
        case 'description':
            return ArgTokens.DESCRIPTION;

        // Braces and punctuation
        case '{':
            return ArgTokens.L_BRACE;
        case '}':
            return ArgTokens.R_BRACE;
        case ':':
            return ArgTokens.COLON;

        // Identifiers (e.g., Goal Names, Strategy Names, etc.)
        default:
            if (token.startsWith('"') && token.endsWith('"')) {
                return ArgTokens.STRING; // Quoted string
            }
            if (!isNaN(Number(token))) {
                return ArgTokens.DIGIT; // Numeric token
            }
            if (/^G\d+$/.test(token)) {
                return ArgTokens.GOAL_NAME; // Goal identifier
            }
            if (token === "toBeDeveloped") {
                return ArgTokens.GOAL_TO_BE_DEVELOPED;
            }
            if (/^S\d+$/.test(token)) {
                return ArgTokens.STRATEGY_NAME; // Strategy identifier
            }
            if (/^E\d+$/.test(token)) {
                return ArgTokens.SOLUTION_NAME; // Solution identifier
            }
            if (/^C\d+$/.test(token)) {
                return ArgTokens.CONTEXT_NAME; // Context identifier
            }
            if (/^ISB\d+$/.test(token)) {
                return ArgTokens.IS_SUPPORTED_BY_NAME; // IsSupportedBy identifier
            }
            if (/^ICO\d+$/.test(token)) {
                return ArgTokens.IN_CONTEXT_OF_NAME; // InContextOf identifier
            }
            if (token === "to") {
                return ArgTokens.RELATION_TO; // Relation 'to'
            }
            if (token === "from") {
                return ArgTokens.RELATION_FROM; // Relation 'from'
            }

            // Return token as-is for unmatched cases
            return token;
    }
};

// Export the tokens and matching function
module.exports = { ArgTokens, matchToken };
