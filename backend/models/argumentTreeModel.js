const { Goal, Strategy, Solution, Context, IsSupportedBy, InContextOf, ArgData } = require('../utils/ArgStructs');
const chalk = require('chalk');

/**
 * Represents a single node in the argument tree.
 */
class ArgumentNode {
    /**
     * Creates an instance of an ArgumentNode.
     * @param {Object} entity - The entity representing the node (e.g., goal, strategy, solution).
     */
    constructor(entity) {
        this.entity = entity; // The entity (goal, strategy, solution, or context) represented by this node
        this.children = []; // The child nodes of this node
        this.failed = false; // Indicates if this node has failed
        this.parent = null; // The parent node of this node
    }

    /**
     * Adds a child node to the current node.
     * @param {ArgumentNode} childNode - The child node to add.
     */
    addChild(childNode) {
        childNode.parent = this;
        this.children.push(childNode);
    }

    /**
     * Converts the node and its children to a JSON representation.
     * @returns {Object} The JSON representation of the node.
     */
    toJSON() {
        return {
            entity: this.entity,
            failed: this.failed,
            children: this.children.map(child => child.toJSON()),
        };
    }
}

/**
 * Represents the argument tree structure.
 */
class ArgumentTree {
    /**
     * Creates an instance of an ArgumentTree.
     * @param {ArgumentNode} rootNode - The root node of the tree.
     */
    constructor(rootNode) {
        this.rootNode = rootNode; // The root node of the tree
    }

    /**
     * Builds the tree structure using argument data.
     * @param {ArgData} argData - The argument data containing goals, strategies, solutions, contexts, and relationships.
     */
    buildTree(argData) {
        const { goals, strategies, solutions, contexts, isSupportedByRelations, inContextOfRelations } = argData;

        const allNodes = {};

        // Create nodes for all entities
        [...goals, ...strategies, ...solutions, ...contexts].forEach(entity => {
            allNodes[entity.id] = new ArgumentNode(entity);
        });

        // Assign the root node
        this.rootNode = allNodes['G1'] || (goals.length && allNodes[goals[0].id]);

        // Establish "is supported by" relationships
        isSupportedByRelations.forEach(relation => {
            const parentNode = allNodes[relation.from];
            const childNode = allNodes[relation.to];
            if (parentNode && childNode) {
                parentNode.addChild(childNode);
            }
        });

        // Establish "in context of" relationships
        inContextOfRelations.forEach(relation => {
            const parentNode = allNodes[relation.from];
            const childNode = allNodes[relation.to];
            if (parentNode && childNode) {
                parentNode.addChild(childNode);
            }
        });
    }

    /**
     * Marks a node and all its parent nodes as failed.
     * @param {ArgumentNode} node - The node to mark as failed.
     */
    failTree(node) {
        let currNode = node;
        while (currNode != null) {
            currNode.failed = true;
            console.log(currNode);
            currNode = currNode.parent;
        }
    }

    /**
     * Finds a node in the tree by its ID.
     * @param {string} id - The ID of the node to find.
     * @param {ArgumentNode} [node=this.rootNode] - The starting node for the search.
     * @returns {ArgumentNode|null} The found node, or null if not found.
     */
    findNodeById(id, node = this.rootNode) {
        if (node.entity.id === id) {
            return node;
        }
        for (const child of node.children) {
            const result = this.findNodeById(id, child);
            if (result) {
                return result;
            }
        }
        return null;
    }

    /**
     * Prints the tree structure to the console with visual formatting.
     * @param {ArgumentNode} [node=this.rootNode] - The node to start printing from.
     * @param {number} [level=0] - The current depth level in the tree.
     */
    printTree(node = this.rootNode, level = 0) {
        const indent = '  '.repeat(level);
        const statusLabel = node.failed
            ? chalk.red.bold('FAILED')
            : chalk.green.bold('PASSED');
        const description = node.failed
            ? chalk.red.bold(node.entity.description)
            : chalk.green(node.entity.description);
        console.log(`${indent}- ${chalk.blue.bold(node.entity.id)}: ${description} (${statusLabel})`);

        node.children.forEach(child => this.printTree(child, level + 1));
    }

    /**
     * Converts the entire tree to a JSON representation.
     * @returns {Object} The JSON representation of the tree.
     */
    toJSON() {
        return this.rootNode.toJSON();
    }

    /**
     * Finds a node in the tree by its description.
     * @param {string} description - The description of the node to find.
     * @returns {ArgumentNode|null} The found node, or null if not found.
     */
    findNodeByDescription(description) {
        function searchNode(node) {
            if (node.entity.description === description) {
                return node;
            }
            for (const child of node.children) {
                const result = searchNode(child);
                if (result) {
                    return result;
                }
            }
            return null;
        }

        return searchNode(this.rootNode);
    }

    /**
     * Creates a pruned tree containing only the failed nodes.
     * @returns {ArgumentTree} A new ArgumentTree containing only failed nodes.
     */
    getPrunedFailureTree() {
        function cloneNode(originalNode) {
            const clonedEntity = { ...originalNode.entity };
            const newNode = new ArgumentNode(clonedEntity);
            newNode.failed = originalNode.failed;
            return newNode;
        }

        function pruneTree(originalNode) {
            if (!originalNode || !originalNode.failed) return null;

            const newNode = cloneNode(originalNode);

            originalNode.children
                .map(child => pruneTree(child))
                .filter(child => child !== null)
                .forEach(child => newNode.addChild(child));

            return newNode;
        }

        const prunedRoot = pruneTree(this.rootNode);
        return new ArgumentTree(prunedRoot);
    }
}

module.exports = { ArgumentNode, ArgumentTree };
