/**
 * Represents a goal in the argument structure.
 * @class
 */
class Goal {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the goal.
     * @param {string} description - A textual description of the goal.
     * @param {boolean} [toBeDeveloped=false] - Indicates if the goal is to be developed.
     */
    constructor(id, description, toBeDeveloped = false) {
        this.id = id;
        this.description = description;
        this.toBeDeveloped = toBeDeveloped;
    }
}

/**
 * Represents a strategy in the argument structure.
 * @class
 */
class Strategy {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the strategy.
     * @param {string} description - A textual description of the strategy.
     */
    constructor(id, description) {
        this.id = id;
        this.description = description;
    }
}

/**
 * Represents a solution in the argument structure.
 * @class
 */
class Solution {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the solution.
     * @param {string} description - A textual description of the solution.
     */
    constructor(id, description) {
        this.id = id;
        this.description = description;
    }
}

/**
 * Represents a context in the argument structure.
 * @class
 */
class Context {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the context.
     * @param {string} description - A textual description of the context.
     * @param {Array<string>} [inContextOf=[]] - A list of identifiers of related contexts.
     */
    constructor(id, description, inContextOf = []) {
        this.id = id;
        this.description = description;
        this.inContextOf = inContextOf;
    }
}

/**
 * Represents a relation indicating support between two entities in the argument structure.
 * @class
 */
class IsSupportedBy {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the relationship.
     * @param {string} from - The identifier of the supporting entity.
     * @param {string} to - The identifier of the supported entity.
     */
    constructor(id, from, to) {
        this.id = id;
        this.from = from;
        this.to = to;
    }
}

/**
 * Represents a relation indicating contextual connection between two entities.
 * @class
 */
class InContextOf {
    /**
     * @constructor
     * @param {string} id - The unique identifier of the relationship.
     * @param {string} from - The identifier of the contextual entity.
     * @param {string} to - The identifier of the entity being contextualized.
     */
    constructor(id, from, to) {
        this.id = id;
        this.from = from;
        this.to = to;
    }
}

/**
 * Represents the collection of argument components and their relationships.
 * @class
 */
class ArgData {
    /**
     * Initializes empty arrays for goals, strategies, solutions, contexts, and their relationships.
     * @constructor
     */
    constructor() {
        this.goals = [];
        this.strategies = [];
        this.solutions = [];
        this.contexts = [];
        this.isSupportedByRelations = [];
        this.inContextOfRelations = [];
    }
}

module.exports = {
    Goal,
    Strategy,
    Solution,
    Context,
    IsSupportedBy,
    InContextOf,
    ArgData
};
