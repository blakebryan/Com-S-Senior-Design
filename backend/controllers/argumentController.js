const { ArgumentNode, ArgumentTree } = require('../models/questionTreeModel');
const { Goal, Strategy, Solution, Context, IsSupportedBy, InContextOf, ArgData } = require('../utils/ArgStructs');


const yaml = require('js-yaml');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');


// Helper function to write string to file
const stringToFile = async (filePath, content) => {
    try {
        await fs.promises.writeFile(filePath, content, 'utf8');
        console.log(`File written successfully to ${filePath}`);
    } catch (error) {
        console.error('Error writing file:', error);
        throw error;
    }
};

function sanitizeText(text) {
    // Remove surrounding quotes if they exist
    text = text.replace(/^"|"$/g, '');
    
    // Handle escaped characters
    text = text.replace(/\\\"/g, '"');  // Convert \" to "
    text = text.replace(/\\\\/g, '\\');  // Convert \\ to \
    
    // Ensure the text is properly quoted if it contains special characters
    if (text.includes('[') || text.includes(']') || text.includes('"')) {
        // Escape quotes
        text = text.replace(/"/g, '\\"');
        // Wrap in quotes
        text = `"${text}"`;
    }
    
    return text;
}


/*

Current Issues:

Repeated nodes lead to incorrect node count on level

If two nodes share a connection and their lines overlap, it breaks

*/
function collectNodesBFS(rootNode) {
    const nodes = {};
    const queue = [{ node: rootNode, level: 0 }];
    const levelCounts = {};
    const seenNodesByLevel = {}; // Track seen nodes by level

    while (queue.length > 0) {
        const { node, level } = queue.shift();
        const { entity, children } = node;

        // Initialize level counter and seen nodes set if not exists
        if (!levelCounts[level]) {
            levelCounts[level] = 0;
            seenNodesByLevel[level] = new Set();
        }

        // Only add node and increment count if it's not already seen at this level
        if (!seenNodesByLevel[level].has(entity.id)) {
            if (!nodes[entity.id]) {
                nodes[entity.id] = {
                    text: sanitizeText(entity.description),
                    horizontalIndex: { absolute: levelCounts[level] }
                };
            } else if (!nodes[entity.id].horizontalIndex) {
                nodes[entity.id].horizontalIndex = { absolute: levelCounts[level] };
            }

            // Mark node as seen at this level
            seenNodesByLevel[level].add(entity.id);
            // Increment counter for this level
            levelCounts[level]++;
        }

        // Initialize undeveloped if toBeDeveloped is true
        if (entity.toBeDeveloped === true) {
            nodes[entity.id].undeveloped = true;
        }

        // Process children if they exist
        if (children && children.length > 0) {
            children.sort((a, b) => {
                const idA = a.entity.id;
                const idB = b.entity.id;
                return idA.localeCompare(idB, undefined, { numeric: true });
            });

            const contextChildren = children.filter(child => child.entity instanceof Context)
                                         .map(child => child.entity.id);
            const supportChildren = children.filter(child => !(child.entity instanceof Context))
                                 .map(child => child.entity.id);

            
            if (contextChildren.length > 0) {
                nodes[entity.id].inContextOf = contextChildren;
            }
            if (supportChildren.length > 0) {
                nodes[entity.id].supportedBy = supportChildren;
            }

            children.forEach(child => {
                queue.push({ node: child, level: level + 1 });
            });
        }
    }

    return nodes;
}


// Main conversion function
const argTreeJSONToYaml = async (argTreeJSON) => {
    const filePath = "./files/output.yaml";
    
    // Collect all nodes and their relationships in BFS order
    const nodes = collectNodesBFS(argTreeJSON);
    
    // Convert to YAML with specific formatting options
    const yamlData = yaml.dump(nodes, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
    });
    
    // Write to file
    await stringToFile(filePath, yamlData);
};

// Generate the argument tree diagram using gsn2x.exe
const generateArgTreeDiagram = (argTreeJSON) => {
    const filePath = path.join(__dirname, '../files/output.yaml');
    const gsnSuasDir = path.join(__dirname, '../../gsn_suas');
    const gsn2xPath = path.join(gsnSuasDir, 'gsn2x.exe');

    argTreeJSONToYaml(tree)

    const command = `cd "${gsnSuasDir}" && "${gsn2xPath}" "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error generating safety case: ${stderr}`);
            return;
        }
        console.log('Argument diagram generated:', stdout);
    });
};

module.exports = {argTreeJSONToYaml, generateArgTreeDiagram}