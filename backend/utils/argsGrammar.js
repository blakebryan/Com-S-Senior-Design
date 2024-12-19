const { ArgTokens } = require('./argsTokens');
const { Goal, Strategy, Solution, Context, IsSupportedBy, InContextOf } = require('./ArgStructs');

/**
 * Parses a goal structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the goal structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: Goal}} Object containing the parse result and the goal instance if successful.
 */
const parseGoal = (matchedTokens, tokens) => {
    let index = 0;
    const goal = new Goal()

    if (matchedTokens[index++] === ArgTokens.GOAL_TO_BE_DEVELOPED) {
        goal.toBeDeveloped = true;
    } else {
        index--;
    }

    if (matchedTokens[index] !== ArgTokens.GOAL_NAME) {
        console.error("Expected Goal Identifier (e.g., G1)");
        return { success: false };
    }

    goal.id = tokens[index];
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after Goal Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.DESCRIPTION) {
        console.error("Expected 'description' token");
        return { success: false };
    }

    if (matchedTokens[index] !== ArgTokens.STRING) {
        console.error("Expected a string description enclosed in quotes");
        return { success: false };
    }

    goal.description = tokens[index];
    index++;


    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the goal");
        return { success: false };
    }

    return { success: true, data: goal };
};

/**
 * Parses a strategy structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the strategy structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: Strategy}} Object containing the parse result and the strategy instance if successful.
 */
const parseStrategy = (matchedTokens, tokens) => {
    let index = 0;
    const strategy = new Strategy()

    if (matchedTokens[index] !== ArgTokens.STRATEGY_NAME) {
        console.error("Expected Strategy Identifier (e.g., S1)");
        return { success: false };
    }

    strategy.id = tokens[index];
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after Strategy Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.DESCRIPTION) {
        console.error("Expected 'description' token");
        return { success: false };
    }


    if (matchedTokens[index] !== ArgTokens.STRING) {
        console.error("Expected a string description enclosed in quotes");
        return { success: false };
    }

    strategy.description = tokens[index];
    index++;


    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the strategy");
        return { success: false };
    }

    return { success: true, data: strategy };
};

/**
 * Parses a solution structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the solution structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: Solution}} Object containing the parse result and the solution instance if successful.
 */
const parseSolution = (matchedTokens, tokens) => {
    let index = 0;
    const solution = new Solution();

    if (matchedTokens[index] !== ArgTokens.SOLUTION_NAME) {
        console.error("Expected Solution Identifier (e.g., S1)");
        return { success: false };
    }

    solution.id = `Sn${tokens[index].slice(1)}`;
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after Solution Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.DESCRIPTION) {
        console.error("Expected 'description' token");
        return { success: false };
    }

    if (matchedTokens[index] !== ArgTokens.STRING) {
        console.error("Expected a string description enclosed in quotes");
        return { success: false };
    }

    solution.description = tokens[index];
    index++;


    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the solution");
        return { success: false };
    }

    return { success: true, data: solution };
};

/**
 * Parses a context structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the context structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: Context}} Object containing the parse result and the context instance if successful.
 */
const parseContext = (matchedTokens, tokens) => {
    let index = 0;
    const context = new Context();

    if (matchedTokens[index] !== ArgTokens.CONTEXT_NAME) {
        console.error("Expected Context Identifier (e.g., S1)");
        return { success: false };
    }

    context.id = tokens[index];
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after Context Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.DESCRIPTION) {
        console.error("Expected 'description' token");
        return { success: false };
    }


    if (matchedTokens[index] !== ArgTokens.STRING) {
        console.error("Expected a string description enclosed in quotes");
        return { success: false };
    }

    context.description = tokens[index];
    index++;


    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the context");
        return { success: false };
    }

    return { success: true, data: context };
};

/**
 * Parses an IsSupportedBy relation structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the IsSupportedBy structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: IsSupportedBy}} Object containing the parse result and the IsSupportedBy instance if successful.
 */
const parseIsSupportedBy = (matchedTokens, tokens) => {
    let index = 0;
    const isSupportedBy = new IsSupportedBy();

    if (matchedTokens[index] !== ArgTokens.IS_SUPPORTED_BY_NAME) {
        console.error("Expected IsSupportedBy Identifier (e.g., S1)");
        return { success: false };
    }

    isSupportedBy.id = tokens[index];
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after IsSupportedBy Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.RELATION_TO) {
        console.error("Expected 'to' token");
        return { success: false };
    }

    if (!(/^(G|S|E|C)\d+$/.test(tokens[index]))) {
        console.error("Expected 'node' token");
        return { success: false };
    }

    isSupportedBy.to = tokens[index];

    if (/^E\d+$/.test(tokens[index])) {
        isSupportedBy.to = `Sn${tokens[index].slice(1)}`
    }

    index++;


    if (matchedTokens[index++] !== ArgTokens.RELATION_FROM) {
        console.error("Expected 'from' token");
        return { success: false };
    }

    if (!(/^(G|S|E|C)\d+$/.test(tokens[index]))) {
        console.error("Expected 'node' token");
        return { success: false };
    }

    isSupportedBy.from = tokens[index];

    if (/^E\d+$/.test(tokens[index])) {
        isSupportedBy.from = `Sn${tokens[index].slice(1)}`
    }

    index++;

    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the IsSupportedBy");
        return { success: false };
    }

    return { success: true, data: isSupportedBy };
};

/**
 * Parses an InContextOf relation structure from tokens.
 * @param {Array<string>} matchedTokens - Array of matched tokens representing the InContextOf structure.
 * @param {Array<string>} tokens - Array of corresponding token values.
 * @returns {{success: boolean, data?: InContextOf}} Object containing the parse result and the InContextOf instance if successful.
 */
const parseInContextOf = (matchedTokens, tokens) => {
    let index = 0;
    const inContextOf = new InContextOf()

    if (matchedTokens[index] !== ArgTokens.IN_CONTEXT_OF_NAME) {
        console.error("Expected InContextOf Identifier (e.g., S1)");
        return { success: false };
    }

    inContextOf.id = tokens[index];
    
    index++;

    if (matchedTokens[index++] !== ArgTokens.L_BRACE) {
        console.error("Expected '{' after InContextOf Identifier");
        return { success: false };
    }

    if (matchedTokens[index++] !== ArgTokens.RELATION_TO) {
        console.error("Expected 'to' token");
        return { success: false };
    }

    if (!(/^(G|S|E|C)\d+$/.test(tokens[index]))) {
        console.error("Expected 'node' token");
        return { success: false };
    }

    inContextOf.to = tokens[index];

    if (/^E\d+$/.test(tokens[index])) {
        inContextOf.to = `Sn${tokens[index].slice(1)}`
    }

    index++;

    if (matchedTokens[index++] !== ArgTokens.RELATION_FROM) {
        console.error("Expected 'from' token");
        return { success: false };
    }

    if (!(/^(G|S|E|C)\d+$/.test(tokens[index]))) {
        console.error("Expected 'node' token");
        return { success: false };
    }


    inContextOf.from = tokens[index];

    if (/^E\d+$/.test(tokens[index])) {
        inContextOf.from = `Sn${tokens[index].slice(1)}`
    }

    index++;

    if (matchedTokens[index++] !== ArgTokens.R_BRACE) {
        console.error("Expected '}' to close the InContextOf");
        return { success: false };
    }

    return { success: true, data: inContextOf };
};


module.exports = { parseGoal, parseStrategy, parseSolution, parseContext, parseIsSupportedBy, parseInContextOf };

