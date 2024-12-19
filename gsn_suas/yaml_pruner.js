/**
 * @file yaml_pruner.js
 * Processes a YAML file by pruning low-risk nodes, maintaining hierarchical structure,
 * and recalculating horizontal indexes for visual consistency.
 * @author Brady Bargren. ISU ID: az2997
 */

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Get input and output YAML file paths from command line arguments.
 */
const inputYamlPath = process.argv[2];
const outputYamlPath = process.argv[3];

if (!inputYamlPath || !outputYamlPath) {
    console.error('Usage: node yaml_pruner.js <input_yaml_path> <output_yaml_path>');
    process.exit(1);
}

let yamlContent;
try {
    // Read and parse the YAML file
    const fileContent = fs.readFileSync(inputYamlPath, 'utf8');
    yamlContent = yaml.load(fileContent);
} catch (err) {
    console.error('Error reading YAML file:', err);
    process.exit(1);
}

// Build a mapping of nodes
const nodes = {};
for (const [nodeId, nodeData] of Object.entries(yamlContent)) {
    nodes[nodeId] = nodeData;
}

/**
 * Collects nodes to delete (low-risk nodes except the root node G1).
 */
const nodesToDelete = new Set();
for (const [nodeId, node] of Object.entries(nodes)) {
    if (nodeId === 'G1') continue; // Exclude root node G1
    if (node.classes && node.classes.includes('low-risk')) {
        nodesToDelete.add(nodeId);
    }
}

// Delete nodes and update `supportedBy` and `inContextOf` references
for (const nodeId of Object.keys(nodes)) {
    const node = nodes[nodeId];
    if (!node) continue;

    if (node.supportedBy) {
        node.supportedBy = node.supportedBy.filter(childId => !nodesToDelete.has(childId));
        if (node.supportedBy.length === 0) delete node.supportedBy;
    }

    if (node.inContextOf) {
        node.inContextOf = node.inContextOf.filter(contextId => !nodesToDelete.has(contextId));
        if (node.inContextOf.length === 0) delete node.inContextOf;
    }
}

nodesToDelete.forEach(nodeId => delete nodes[nodeId]);

/**
 * Traverses the node tree starting from G1 to collect all reachable nodes.
 *
 * @param {string} nodeId - The ID of the current node being traversed.
 */
const reachableNodes = new Set();
function traverse(nodeId) {
    if (reachableNodes.has(nodeId) || !nodes[nodeId]) return;
    reachableNodes.add(nodeId);

    const node = nodes[nodeId];
    if (node.supportedBy) node.supportedBy.forEach(traverse);
    if (node.inContextOf) node.inContextOf.forEach(traverse);
}
traverse('G1');

// Remove nodes not reachable from G1
for (const nodeId of Object.keys(nodes)) {
    if (!reachableNodes.has(nodeId)) delete nodes[nodeId];
}

/**
 * Recomputes horizontal indexes for all nodes in the tree.
 */
function assignHorizontalIndexes() {
    const levels = {}; // Map of level -> array of node IDs
    const queue = [{ nodeId: 'G1', level: 0 }];

    // Perform breadth-first traversal to populate levels
    while (queue.length > 0) {
        const { nodeId, level } = queue.shift();
        if (!levels[level]) levels[level] = [];
        levels[level].push(nodeId);

        const node = nodes[nodeId];
        if (node && node.supportedBy) {
            node.supportedBy.forEach(childId => {
                if (nodes[childId]) queue.push({ nodeId: childId, level: level + 1 });
            });
        }
    }

    // Assign horizontalIndex incrementally for each level
    for (const [level, nodeIds] of Object.entries(levels)) {
        let index = 0;
        for (const nodeId of nodeIds) {
            const node = nodes[nodeId];
            if (!node.horizontalIndex) node.horizontalIndex = {};
            node.horizontalIndex.absolute = index;
            index++;
        }
    }
}

assignHorizontalIndexes();

try {
    // Write the pruned YAML content back to a file
    const yamlString = yaml.dump(nodes, { noRefs: true });
    fs.writeFileSync(outputYamlPath, yamlString, 'utf8');
    console.log(`Pruned YAML file successfully written to ${outputYamlPath}`);
} catch (err) {
    console.error('Error writing pruned YAML file:', err);
    process.exit(1);
}

module.exports = {
    traverse,
    assignHorizontalIndexes,
};
