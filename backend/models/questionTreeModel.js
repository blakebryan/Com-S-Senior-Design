/**
 * Represents a node in a question tree.
 */
class QuestionNode {

    /**
     * Creates a QuestionNode instance.
     * @param {string} id - The unique identifier for the node.
     * @param {number} depth - The depth of the node in the tree.
     * @param {string} [abstract="false"] - Indicates if the node is abstract.
     * @param {string} [mandatory="false"] - Indicates if the node is mandatory.
     */
    constructor(id, depth, abstract = "false", mandatory = "false") {
        this.identifier = id;
        this.type = null;
        this.children = [];
        this.depth = depth;
        this.questionType = null;
        this.keyword = null;
        this.abstract = abstract;
        this.mandatory = mandatory;
    }

    /**
     * Adds a child node to this node.
     * @param {QuestionNode} childNode - The child node to add.
     */
    addChild(childNode) {
        childNode.parent = this;
        this.children.push(childNode);
    }

    /**
     * Recursively categorizes the node and its children into types (e.g., root, category, question, answer).
     * @param {QuestionNode[]} questionSet - An array to store categorized question nodes.
     */
    nodeTypeCheck(questionSet) {
        // Log for inspection
        console.log();
        console.log("INSPECTING: " + this.identifier);

        // Identify the root
        if (this.depth === 0) {
            this.type = "root";
        } else if (this.abstract === "true") {
            // If the node is abstract, it cannot be a question, so categorize as 'category'
            this.type = "category";
        } else {
            // Check if this is a question by looking at the identifier
            // All questions have type specified in all caps at the beginning of their identifier.
            // Example: FLOAT_Name, LIST_Name, etc.
            // Ensure the identifier has length > 1 before checking charAt(1).
            if (this.identifier.length > 1 && this.identifier.charAt(1) === this.identifier.charAt(1).toUpperCase()) {
                this.type = "question";
                questionSet.push(this);
            } else {
                // If it doesn't meet the above conditions, treat it as an answer
                this.type = "answer";
            }
        }

        console.log("Categorized as: " + this.type);
        console.log();

        // For each child, recursively determine node types
        this.children.forEach((child) => {
            child.nodeTypeCheck(questionSet);
        });
    }

    /**
     * Sets the question type for this node based on its identifier or children.
     */
    setNodeQuestionType() {
        // Log initial state
        console.log(`Setting a question type for node: ${this.identifier}`);

        // If no children, log error and exit
        // if (this.children.length <= 0) {
        //     console.error("Corrupted tree structure: question node should have at least one child. Check XML structure!");
        //     return; // Handle the error gracefully
        // }

        // Normalize for case-insensitive checks
        const lowerId = this.identifier.toLowerCase();

        // ---------------------
        // First: Identify type from `identifier` prefixes
        // ---------------------

        // Integer type
        if (lowerId.includes("int_")) {
            this.questionType = "integer";
            // replace underscores with spaces for user readability
            this.identifier = this.identifier.substring(lowerId.indexOf("int_") + 4).replaceAll("_", " ");
            console.log(`Type: integer`);
            return;
        }

        // Float type
        if (lowerId.includes("float_")) {
            this.questionType = "float";
            this.identifier = this.identifier.substring(lowerId.indexOf("float_") + 6).replaceAll("_", " ");
            console.log(`Type: float`);
            return;
        }

        // ZIP code type
        if (lowerId.includes("string_zip")) {
            this.questionType = "zip";
            this.identifier = this.identifier.substring(lowerId.indexOf("string_zip") + 7).replaceAll("_", " ");
            console.log(`Type: zip code`);
            return;
        }

        // City name type
        if (lowerId.includes("string_city")) {
            this.questionType = "text";
            this.identifier = this.identifier.substring(lowerId.indexOf("string_city") + 7).replaceAll("_", " ");
            console.log(`Type: text(city)`);
            return;
        }

        // Boolean type
        if (lowerId.includes("bool_")) {
            this.questionType = "boolean";
            this.identifier = this.identifier.substring(lowerId.indexOf("bool_") + 5).replaceAll("_", " ");
            console.log(`Type: boolean`);
            return;
        }

        // Multiple choice (tuple) type
        if (lowerId.includes("tuple_")) {
            // Check if multiple distinct choices exist among children
            const uniqueChoices = new Set(
                this.children
                    .filter(child => child.type === "answer")
                    .map(child => child.identifier.toLowerCase())
            );
            this.questionType = "multiple choice";
            this.identifier = this.identifier.substring(lowerId.indexOf("tuple_") + 6).replaceAll("_", " ");
            console.log("Type: multiple choice question");
            return;
        }

        // List type
        if (lowerId.includes("list_")) {
            this.questionType = "list";
            this.identifier = this.identifier.substring(lowerId.indexOf("list_") + 5).replaceAll("_", " ");
            console.log("Type: list question");
            return;
        }

        // Calculated (calc) type
        if (lowerId.includes("calc_")) {
            this.questionType = "calc";
            this.identifier = this.identifier.substring(lowerId.indexOf("calc_") + 5).replaceAll("_", " ");
            console.log("Type: calc type question");
            return;
        }

        // ---------------------
        // If we haven't returned yet, fallback to logic based on children
        // ---------------------

        // If there is only one child, default to text
        if (this.children.length === 1) {
            this.questionType = "text";
            // console.log("Type: text question");
            return;
        } else {
            // If multiple children, check if any have 'free response' keywords
            const textQuestionKeywords = ["greater", "less", "between", "atleast", "sufficient"];
            for (const child of this.children) {
                for (const kw of textQuestionKeywords) {
                    if (child.identifier.toLowerCase().includes(kw)) {
                        this.questionType = "text";
                        // console.log("Type: text question");
                        return;
                    }
                }
            }
        }

        // Check for boolean (true/false, yes/no) hints in children
        const trueFalseQuestions = ["_yes", "_no", "true", "false"];
        for (const child of this.children) {
            for (const tf of trueFalseQuestions) {
                if (child.identifier.toLowerCase().includes(tf)) {
                    this.questionType = "boolean";
                    // console.log("Type: boolean question");
                    return;
                }
            }
        }

        // Check for multiple distinct choices for multiple choice scenario
        if (this.children.length >= 2) {
            const uniqueChoices = new Set(this.children.map(child => child.identifier.toLowerCase()));
            if (uniqueChoices.size > 1) {
                this.questionType = "multiple choice";
                // console.log("Type: multiple choice question");
                return;
            }
        }

        // Default to dropdown if no conditions are met
        this.questionType = "dropdown";
        console.log("Type: dropdown question");
    }

    /**
     * Converts the node and its children to a JSON representation.
     * @returns {Object} The JSON representation of the node.
     */
    toJSON() {
        return {
            identifier: this.identifier,
            type: this.type,
            questionType: this.questionType,
            depth: this.depth,
            mandatory: this.mandatory,
            children: this.children.map(child => child.toJSON()) // Recursively call toJSON on children
        };
    }

}

/**
 * Represents the entire question tree structure.
 */
class QuestionTree {
    root;
    questionSet;

    /**
     * Creates a QuestionTree instance.
     * @param {QuestionNode} root - The root node of the tree.
     */
    constructor(root) {
        this.root = root;
        this.questionSet = [];
       // console.log("Created a tree instance with the root: " + this.root.identifier + " with "+this.root.children.length + " children");
    }

    /**
     * Categorizes the tree nodes into types (e.g., root, category, question, answer).
     */
    categorizeTree() {
        this.root.nodeTypeCheck(this.questionSet);
    }

    /**
     * Sets the question type for each node in the question set.
     */
    categtorizeQuestions(){
        //console.log("question set length: " + this.questionSet.length);
        this.questionSet.forEach( (node) => {
            node.setNodeQuestionType();
        })
    }

    /**
     * Converts the entire tree to a JSON representation.
     * @returns {Object} The JSON representation of the tree.
     */
    toJSON() {
        return this.root.toJSON();
    }

    /**
     * Prints the tree structure with indentation for each depth level.
     */
    print() {
        const printNode = (node) => {
            // Create indentation based on the node's depth
            const indentation = ' '.repeat(node.depth * 2); // 2 spaces per depth level
            // Build the output string
            let output = `${indentation}Identifier: ${node.identifier}, Type: ${node.type}`;
            // Include question type if it is not null
            if (node.questionType) {
                output += `, Question Type: ${node.questionType}`;
            }
            console.log(output);
            // Recursively print children
            node.children.forEach(child => printNode(child));
        };
        // Start printing from the root
        printNode(this.root);
    }
}

module.exports = {QuestionNode, QuestionTree };
