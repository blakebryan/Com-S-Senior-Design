const { QuestionNode, QuestionTree } = require('../models/questionTreeModel');
const parseXMLToJS = require('../utils/xmlParser');

/**
 * Recursively traverses the XML structure and builds a tree representation.
 *
 * @param {Object} node - The current XML node being processed.
 * @param {QuestionNode|null} parentNode - The parent node to which the current node will be added as a child.
 * @param {number} depth - The current depth level in the tree.
 * @returns {QuestionNode} The newly created node corresponding to the current XML element.
 */
const traverseAndBuildTree = (node, parentNode, depth) => {
    const identifier = node.$ && node.$.name ? node.$.name : 'Unnamed';
    const abstract = node.$ && node.$.abstract ? node.$.abstract : 'false';
    const mandatory = node.$ && node.$.mandatory ? node.$.mandatory : 'false';
    const offset = '   '.repeat(depth);
    console.log(`${offset}Building node: ${identifier} at depth: ${depth}`);

    const newNode = new QuestionNode(identifier, depth, abstract, mandatory);

    if (parentNode != null) {
        parentNode.addChild(newNode);
    }

    // Process child nodes based on their keywords
    ['and', 'or', 'alt', 'feature'].forEach(keyword => {
        if (node[keyword]) {
            const children = Array.isArray(node[keyword]) ? node[keyword] : [node[keyword]];
            children.forEach(child => {
                newNode.keyword = keyword;
                traverseAndBuildTree(child, newNode, depth + 1);
            });
        }
    });

    return newNode;
};

/**
 * Converts the parsed XML structure into a tree representation.
 *
 * @param {Object} result - The parsed XML object.
 * @returns {QuestionTree|null} A `QuestionTree` object if parsing is successful, or `null` if the structure is invalid.
 */
const parseToTree = (result) => {
    if (result.featureModel && result.featureModel.struct) {
        const rootNode = traverseAndBuildTree(result.featureModel.struct.and, null, 0);
        return new QuestionTree(rootNode);
    } else {
        console.log("Error: 'struct' section not found in the XML model.");
        return null;
    }
};

/**
 * Generates questions based on the XML model and the tree structure.
 *
 * @async
 * @returns {Promise<QuestionTree|Array>} The generated `QuestionTree` object, or an empty array if parsing fails.
 */
const generateQuestions = async () => {
    console.log("----------------------------------------------------------");
    console.log("Parsing XML");
    //const model = await parseXMLToJS('../test_files/test_model.xml');
    const model = await parseXMLToJS('model.xml');
    console.log("Parsed XML");
    console.log("----------------------------------------------------------");

    console.log("----------------------------------------------------------");
    console.log("Generating tree");
    const tree = parseToTree(model);
    if (!tree) {
        return [];
    }
    console.log("Generated initial tree");
    console.log("----------------------------------------------------------");

    console.log("----------------------------------------------------------");
    console.log("Categorizing tree");
    tree.categorizeTree();
    console.log("Finished categorizing tree");
    console.log("----------------------------------------------------------");

    console.log("----------------------------------------------------------");
    console.log("Categorizing question set");
    tree.categtorizeQuestions();
    console.log("Finished categorizing question set");
    console.log("----------------------------------------------------------");

    return tree;
};

/**
 * Parses a set of question nodes into a structured question format.
 *
 * @async
 * @param {Array<QuestionNode>} questionSet - The set of question nodes to be parsed.
 * @returns {Array<Object>} An array of question objects, each containing name, text, and type, with optional children for multiple-choice or dropdown types.
 */
const parseQuestionTree = async (questionSet) => {
    const questions = questionSet.map(node => {
        switch (node.questionType) {
            case 'boolean':
                return {
                    name: node.identifier,
                    text: `${node.identifier}?`,
                    type: 'boolean'
                };
            case 'multiple choice':
                const options = node.children.map(child => ({
                    identifier: child.identifier
                }));
                return {
                    name: node.identifier,
                    text: `Select the appropriate option for ${node.identifier}`,
                    type: 'multiple-choice',
                    children: options
                };
            case 'text':
                return {
                    name: node.identifier,
                    text: `Please provide details for ${node.identifier}`,
                    type: 'text'
                };
            case 'dropdown':
                const dropdownOptions = node.children.map(child => ({
                    identifier: child.identifier
                }));
                return {
                    name: node.identifier,
                    text: `Select from dropdown for ${node.identifier}`,
                    type: 'dropdown',
                    children: dropdownOptions
                };
            default:
                return null;
        }
    });

    return questions.filter(question => question !== null);
};

module.exports = { generateQuestions, parseQuestionTree };
