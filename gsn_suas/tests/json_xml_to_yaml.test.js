const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Mock the file system and YAML modules
jest.mock('fs');
jest.mock('js-yaml');

// Provide mock implementations for fs and yaml
fs.readFileSync = jest.fn((filePath) => {
    if (filePath.endsWith('safetyCaseData.json')) {
        // Return a mock JSON string
        return JSON.stringify({
            entity: { id: 'G1' },
            children: [
                { entity: { id: 'G2' }, failed: true, children: [] },
            ],
        });
    }
    if (filePath.endsWith('.yaml')) {
        // Return a mock YAML template
        return `
G1:
  supportedBy:
    - G2
  classes: []
G2:
  supportedBy:
    - Sn1
  classes: []
Sn1:
  supportedBy: []
  classes: []
`;
    }
    throw new Error(`Unknown file path: ${filePath}`);
});

fs.writeFileSync = jest.fn((filePath, data) => {
    console.log(`Mock write to ${filePath}:\n${data}`);
});

yaml.dump = jest.fn((data) => JSON.stringify(data, null, 2));
yaml.load = jest.fn((data) => {
    // Parse YAML strings into JavaScript objects
    if (typeof data === 'string' && data.trim().startsWith('G1:')) {
        return {
            G1: { supportedBy: ['G2'], classes: [] },
            G2: { supportedBy: ['Sn1'], classes: [] },
            Sn1: { supportedBy: [], classes: [] },
        };
    }
    throw new Error('Invalid YAML format');
});


// Import the functions from the file being tested
const {
    applyFailureStatusFromData,
    applyDescriptionsFromData,
    propagateRiskLevels,
    removeUnusedSnNodes,
    writeUpdatedYaml,
} = require('../json_xml_to_yaml');

describe('json_xml_to_yaml.js', () => {
    let yamlContent, nodeData, outputPath;

    beforeEach(() => {
        // Reset mock implementations before each test
        jest.clearAllMocks();

        // Sample YAML content for testing
        yamlContent = {
            G1: { supportedBy: ['G2'], classes: [] },
            G2: { supportedBy: ['Sn1'], classes: [] },
            Sn1: { supportedBy: [], classes: [] },
        };

        // Sample JSON node data
        nodeData = {
            entity: { id: 'G1', description: '"Top Level Goal"' },
            failed: false,
            children: [
                { entity: { id: 'G2', description: '"Sub Goal"' }, failed: true, children: [] },
            ],
        };

        outputPath = '/path/to/output.yaml';
    });

    describe('applyFailureStatusFromData', () => {
        it('should apply failure status recursively', () => {
            applyFailureStatusFromData(yamlContent, nodeData);

            expect(yamlContent['G1'].classes).toContain('low-risk');
            expect(yamlContent['G2'].classes).toContain('high-risk');
        });

        it('should warn for missing YAML nodes', () => {
            console.warn = jest.fn();

            const incompleteData = { entity: { id: 'G3' }, failed: true };
            applyFailureStatusFromData(yamlContent, incompleteData);

            expect(console.warn).toHaveBeenCalledWith(
                'No corresponding YAML node found for JSON node G3'
            );
        });
    });

    describe('applyDescriptionsFromData', () => {
        it('should apply descriptions to YAML nodes', () => {
            applyDescriptionsFromData(yamlContent, nodeData);

            expect(yamlContent['G1'].text).toBe('Top Level Goal');
            expect(yamlContent['G2'].text).toBe('Sub Goal');
        });

        it('should warn for missing YAML nodes when applying descriptions', () => {
            console.warn = jest.fn();

            const incompleteData = { entity: { id: 'G3', description: '"Missing Node"' } };
            applyDescriptionsFromData(yamlContent, incompleteData);

            expect(console.warn).toHaveBeenCalledWith(
                'No corresponding YAML node found for JSON node G3 when applying description'
            );
        });
    });

    describe('propagateRiskLevels', () => {
        it('should propagate risk levels from children to parents', () => {
            // Set up YAML content with G2 as high-risk
            yamlContent['G2'].classes.push('high-risk');

            // Propagate risks
            propagateRiskLevels(yamlContent);

            // Validate propagation
            expect(yamlContent['G1'].classes).toContain('high-risk');
        });

        it('should assign low-risk if no child nodes are high-risk', () => {
            propagateRiskLevels(yamlContent);

            expect(yamlContent['G1'].classes).toContain('low-risk');
        });
    });

    describe('removeUnusedSnNodes', () => {
        it('should remove unused Sn nodes from YAML content', () => {
            yamlContent['Sn2'] = {};
            removeUnusedSnNodes(yamlContent);

            expect(yamlContent['Sn2']).toBeUndefined();
            expect(yamlContent['Sn1']).toBeDefined();
        });
    });

    describe('writeUpdatedYaml', () => {
        it('should write YAML content to a file', () => {
            yaml.dump.mockReturnValue('mockYamlContent');
            fs.writeFileSync.mockImplementation(() => {});

            writeUpdatedYaml(yamlContent, outputPath);

            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, 'mockYamlContent', 'utf8');
        });

        it('should throw an error if writing fails', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            expect(() => writeUpdatedYaml(yamlContent, outputPath)).toThrow('Write error');
        });
    });

    describe('Integration Tests', () => {
        it('should process safety case data and write updated YAML', () => {
            // Mock YAML and JSON loading
            yaml.load.mockReturnValue({
                G1: { supportedBy: ['G2'], classes: [] },
                G2: { supportedBy: ['Sn1'], classes: [] },
                Sn1: { supportedBy: [], classes: [] },
            });
            fs.readFileSync.mockReturnValue(JSON.stringify(nodeData));
            yaml.dump.mockReturnValue('mockYamlContent');
            fs.writeFileSync.mockImplementation(() => {});

            // Run processing
            applyFailureStatusFromData(yamlContent, nodeData);
            propagateRiskLevels(yamlContent);
            removeUnusedSnNodes(yamlContent);
            writeUpdatedYaml(yamlContent, outputPath);

            // Assertions
            expect(yaml.dump).toHaveBeenCalledWith(yamlContent, { noRefs: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, 'mockYamlContent', 'utf8');
        });
    });
});
