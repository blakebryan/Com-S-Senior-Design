/**
 * @file json_xml_to_yaml.js
 * Converts JSON safety case data to a YAML format, processes risk levels, and applies pruning logic.
 * @author Brady Bargren. ISU ID: az2997
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const timestamp = process.argv[2];

// Resolve paths dynamically for portability
const baseDir = path.resolve(__dirname, '..');
const safetyCaseDataPath = path.join(baseDir, 'backend', 'exports', 'safetyCaseData.json');

// Ensure the images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

/**
 * Applies failure status from JSON data to YAML content.
 * Marks nodes as either 'low-risk' or 'high-risk' based on the `failed` attribute in the JSON.
 *
 * @param {Object} yamlContent - The YAML content to be updated.
 * @param {Object} nodeData - The JSON node data containing `failed` attributes and child nodes.
 */
function applyFailureStatusFromData(yamlContent, nodeData) {
    const nodeId = nodeData.entity.id;

    if (!yamlContent[nodeId]) {
        console.warn(`No corresponding YAML node found for JSON node ${nodeId}`);
    } else {
        const yamlNode = yamlContent[nodeId];
        yamlNode.classes = yamlNode.classes || [];

        // Remove existing risk classes
        yamlNode.classes = yamlNode.classes.filter(c => !['low-risk', 'high-risk'].includes(c));

        // Assign risk level based on the 'failed' attribute
        if (nodeData.failed === true) {
            yamlNode.classes.push('high-risk');
        } else if (nodeData.failed === false) {
            yamlNode.classes.push('low-risk');
        } else {
            console.warn(`Node ${nodeId} has an undefined 'failed' status. Defaulting to 'high-risk'.`);
            yamlNode.classes.push('high-risk');
        }
    }

    // Recursively apply to children
    if (nodeData.children && nodeData.children.length > 0) {
        nodeData.children.forEach(child => applyFailureStatusFromData(yamlContent, child));
    }
}

/**
 * Applies descriptions from JSON data into the text fields of YAML content.
 *
 * @param {Object} yamlContent - The YAML content to be updated.
 * @param {Object} nodeData - The JSON node data containing descriptions and child nodes.
 */
function applyDescriptionsFromData(yamlContent, nodeData) {
    const nodeId = nodeData.entity.id;

    if (!yamlContent[nodeId]) {
        console.warn(`No corresponding YAML node found for JSON node ${nodeId} when applying description`);
    } else {
        const yamlNode = yamlContent[nodeId];
        let desc = nodeData.entity.description;
        if (desc.startsWith('"') && desc.endsWith('"')) {
            desc = desc.slice(1, -1);
        }
        yamlNode.text = desc;
    }

    // Recursively process children for descriptions
    if (nodeData.children && nodeData.children.length > 0) {
        nodeData.children.forEach(child => applyDescriptionsFromData(yamlContent, child));
    }
}

/**
 * Propagates risk levels from child nodes to parent nodes in the YAML content.
 * Nodes are labeled as 'high-risk' if any of their child nodes are 'high-risk'; otherwise, they are 'low-risk'.
 *
 * @param {Object} yamlContent - The YAML content to process.
 */
function propagateRiskLevels(yamlContent) {
    const assignRiskLevel = (nodeKey) => {
        const node = yamlContent[nodeKey];
        if (!node) return 'low-risk'; // Default to low-risk for nodes not found in YAML

        // Skip propagating for solution nodes (Sn)
        if (nodeKey.startsWith('Sn')) {
            if (node.classes && node.classes.includes('high-risk')) return 'high-risk';
            return 'low-risk';
        }

        let childRiskLevels = [];
        if (node.supportedBy) {
            node.supportedBy.forEach(childKey => {
                const childLevel = assignRiskLevel(childKey);
                childRiskLevels.push(childLevel);
            });
        }

        // Default to low-risk for this node
        let nodeRisk = 'low-risk';

        // If any child has 'high-risk', this node becomes 'high-risk'
        if (childRiskLevels.includes('high-risk')) {
            nodeRisk = 'high-risk';
        }

        // Clean current classes and assign the final risk level
        node.classes = node.classes || [];
        node.classes = node.classes.filter(c => !['low-risk', 'high-risk'].includes(c));
        node.classes.push(nodeRisk);

        return nodeRisk;
    };

    // Begin propagation from the root node (assumed to be G1)
    if (yamlContent['G1']) {
        assignRiskLevel('G1');
    } else {
        console.error('G1 node not found in YAML content.');
    }
}

/**
 * Removes unused solution nodes (Sn) from the YAML content that are not referenced by any other nodes.
 *
 * @param {Object} yamlContent - The YAML content to prune.
 */
function removeUnusedSnNodes(yamlContent) {
    const allSnKeys = Object.keys(yamlContent).filter(key => key.startsWith('Sn'));
    const referencedKeys = new Set();

    Object.values(yamlContent).forEach(node => {
        if (node.supportedBy) {
            node.supportedBy.forEach(ref => {
                if (ref.startsWith('Sn')) {
                    referencedKeys.add(ref);
                }
            });
        }
    });

    allSnKeys.forEach(snKey => {
        if (!referencedKeys.has(snKey)) {
            delete yamlContent[snKey];
        }
    });
}

/**
 * Writes the updated YAML content to a specified file.
 *
 * @param {Object} updatedYaml - The YAML content to write.
 * @param {string} outputPath - The path to the output file.
 */
function writeUpdatedYaml(updatedYaml, outputPath) {
    try {
        const yamlString = yaml.dump(updatedYaml, { noRefs: true });
        fs.writeFileSync(outputPath, yamlString, 'utf8');
        console.log(`YAML file successfully updated at ${outputPath}`);
    } catch (err) {
        console.error(`Error writing YAML file to ${outputPath}:`, err.message);
        throw err;
    }
}

// Main execution
(async () => {
    try {
        const loadSafetyCaseData = () => {
            try {
                const data = fs.readFileSync(safetyCaseDataPath, 'utf8');
                if (!data) {
                    throw new Error('Safety case data is empty or undefined');
                }
                return JSON.parse(data);
            } catch (err) {
                console.error(`Error reading JSON from ${safetyCaseDataPath}:`, err);
                return null;
            }
        };


        const loadYamlTemplate = (templatePath) => {
            try {
                const fileContent = fs.readFileSync(templatePath, 'utf8');
                return yaml.load(fileContent);
            } catch (err) {
                console.error('Error reading YAML template:', err);
                throw err;
            }
        };

        const safetyCaseTemplatePath = path.join(__dirname, 'templates', 'safety_case_template.gsn.yaml');
        const outputSafetyCaseYamlPath = path.join(__dirname, 'images', `safety_case_${timestamp}.gsn.yaml`);

        const safetyCaseYamlTemplate = loadYamlTemplate(safetyCaseTemplatePath);
        const safetyCaseData = loadSafetyCaseData();

        if (safetyCaseData) {
            applyFailureStatusFromData(safetyCaseYamlTemplate, safetyCaseData);
            applyDescriptionsFromData(safetyCaseYamlTemplate, safetyCaseData);
        }

        propagateRiskLevels(safetyCaseYamlTemplate);
        removeUnusedSnNodes(safetyCaseYamlTemplate);

        writeUpdatedYaml(safetyCaseYamlTemplate, outputSafetyCaseYamlPath);
    } catch (err) {
        console.error('Error:', err);
    }
})();

module.exports = {
    applyFailureStatusFromData,
    applyDescriptionsFromData,
    propagateRiskLevels,
    removeUnusedSnNodes,
    writeUpdatedYaml,
};

