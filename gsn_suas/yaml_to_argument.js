/**
 * @file yaml_to_argument.js
 * Converts a YAML file containing GSN (Goal Structuring Notation) nodes into an
 * .argument file format for structured argumentation systems.
 * @author Brady Bargren. ISU ID: az2997
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path'); // For managing file paths

/**
 * Get the input YAML file path and output .argument file path from command line arguments.
 */
const inputYamlPath = process.argv[2];
const outputArgumentPath = process.argv[3];

if (!inputYamlPath || !outputArgumentPath) {
    console.error('Usage: node yaml_to_argument.js <input_yaml_path> <output_argument_path>');
    process.exit(1);
}

let yamlContent;
try {
    // Read and parse the input YAML file
    const fileContent = fs.readFileSync(inputYamlPath, 'utf8');
    yamlContent = yaml.load(fileContent);
} catch (err) {
    console.error('Error reading YAML file:', err);
    process.exit(1);
}

const elements = []; // Stores argument elements (e.g., Goals, Strategies)
const relationships = []; // Stores relationships between elements (e.g., IsSupportedBy)
const processedNodes = new Set(); // Tracks processed nodes to avoid duplicates

/**
 * Processes a node and collects its elements and relationships.
 *
 * @param {string} nodeId - The ID of the node to process.
 */
function processNode(nodeId) {
    if (processedNodes.has(nodeId)) {
        return; // Skip nodes that have already been processed
    }
    processedNodes.add(nodeId);

    const nodeData = yamlContent[nodeId];
    if (!nodeData) {
        console.warn(`Node ${nodeId} not found in YAML content.`);
        return;
    }

    const { text, supportedBy, inContextOf, undeveloped, ...otherProps } = nodeData;
    let type;

    // Determine the type of the node based on its ID prefix
    if (nodeId.startsWith('G')) {
        type = 'Goal';
    } else if (nodeId.startsWith('S')) {
        type = 'Strategy';
    } else if (nodeId.startsWith('Sn')) {
        type = 'Solution';
    } else if (nodeId.startsWith('C')) {
        type = 'Context';
    } else if (nodeId.startsWith('A')) {
        type = 'Assumption';
    } else if (nodeId.startsWith('J')) {
        type = 'Justification';
    } else {
        type = 'Goal'; // Default to 'Goal' if unknown
    }

    let elementText = `${type} `;

    if (undeveloped) {
        elementText += 'toBeDeveloped ';
    }

    elementText += `${nodeId} {\n`;

    // Add description if available
    if (text) {
        elementText += `\tdescription "${text}"\n`;
    }

    // Include additional properties such as classes or horizontalIndex
    for (const [key, value] of Object.entries(otherProps)) {
        if (key !== 'supportedBy' && key !== 'inContextOf') {
            let valueStr = Array.isArray(value) || typeof value === 'object'
                ? JSON.stringify(value)
                : value;
            elementText += `\t${key} ${valueStr}\n`;
        }
    }

    elementText += `}`;
    elements.push(elementText);

    // Process supportedBy relationships and their child nodes
    if (supportedBy) {
        supportedBy.forEach(childId => {
            const relationshipText = `IsSupportedBy ISB_${nodeId}_${childId} {\n\tto ${childId} from ${nodeId}\n}`;
            relationships.push(relationshipText);
            processNode(childId); // Recursively process the child node
        });
    }

    // Process inContextOf relationships and their context nodes
    if (inContextOf) {
        inContextOf.forEach(contextId => {
            const relationshipText = `InContextOf ICO_${nodeId}_${contextId} {\n\tto ${contextId} from ${nodeId}\n}`;
            relationships.push(relationshipText);
            processNode(contextId); // Recursively process the context node
        });
    }
}

// Process all nodes starting from the root
for (const nodeId of Object.keys(yamlContent)) {
    processNode(nodeId);
}

/**
 * Constructs the .argument file content with elements and relationships.
 */
let argumentContent = 'Argument 1.3 Generated_Argument\n\n';

// Add all elements to the .argument file content
elements.forEach(element => {
    argumentContent += `${element}\n`;
});

// Add all relationships to the .argument file content
relationships.forEach(relationship => {
    argumentContent += `${relationship}\n`;
});

// Ensure the output directory exists
const outputDir = path.dirname(outputArgumentPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    // Write the constructed .argument file content to the output path
    fs.writeFileSync(outputArgumentPath, argumentContent, 'utf8');
    console.log(`Argument file successfully generated at ${outputArgumentPath}`);
} catch (err) {
    console.error('Error writing argument file:', err);
    process.exit(1);
}

module.exports = {
    processNode,
};
