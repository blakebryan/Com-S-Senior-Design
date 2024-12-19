const fs = require('fs');
const yaml = require('js-yaml');

// Mock the file system and YAML modules
jest.mock('fs');
jest.mock('js-yaml');

// Mock implementations for fs and yaml
fs.readFileSync = jest.fn((filePath) => {
    if (filePath.endsWith('.yaml')) {
        // Return a mock YAML structure
        return `
G1:
  supportedBy:
    - G2
  classes: []
G2:
  supportedBy:
    - G3
  classes: ["low-risk"]
G3:
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
            G2: { supportedBy: ['G3'], classes: ['low-risk'] },
            G3: { supportedBy: ['Sn1'], classes: [] },
            Sn1: { supportedBy: [], classes: [] },
        };
    }
    throw new Error('Invalid YAML format');
});

// Import the file under test
require('../yaml_pruner');

describe('yaml_pruner.js', () => {
    let yamlContent;

    beforeEach(() => {
        jest.clearAllMocks();

        yamlContent = {
            G1: { supportedBy: ['G2'], classes: [] },
            G2: { supportedBy: ['G3'], classes: ['low-risk'] },
            G3: { supportedBy: ['Sn1'], classes: [] },
            Sn1: { supportedBy: [], classes: [] },
        };
    });

    describe('Pruning low-risk nodes', () => {
        it('should remove low-risk nodes except for the root (G1)', () => {
            yaml.load.mockReturnValue(yamlContent);

            const inputYamlPath = '/path/to/input.yaml';
            const outputYamlPath = '/path/to/output.yaml';

            fs.readFileSync.mockReturnValueOnce(JSON.stringify(yamlContent));

            // Invoke the script
            require('../yaml_pruner');

            const updatedYamlContent = yaml.dump.mock.calls[0][0];

            // Ensure G2 is removed (low-risk)
            expect(updatedYamlContent).not.toHaveProperty('G2');
            // Ensure G1 is retained
            expect(updatedYamlContent).toHaveProperty('G1');
        });

        it('should remove unreachable nodes from the tree', () => {
            yaml.load.mockReturnValue({
                G1: { supportedBy: ['G2'], classes: [] },
                G2: { supportedBy: ['G3'], classes: [] },
                G3: { supportedBy: [], classes: [] },
                G4: { supportedBy: [], classes: [] }, // Unreachable node
            });

            const inputYamlPath = '/path/to/input.yaml';
            const outputYamlPath = '/path/to/output.yaml';

            fs.readFileSync.mockReturnValueOnce(JSON.stringify(yamlContent));

            // Invoke the script
            require('../yaml_pruner');

            const updatedYamlContent = yaml.dump.mock.calls[0][0];

            // Ensure unreachable node G4 is removed
            expect(updatedYamlContent).not.toHaveProperty('G4');
        });
    });

    describe('Recomputing horizontal indexes', () => {
        it('should recompute horizontal indexes for all nodes', () => {
            yaml.load.mockReturnValue({
                G1: { supportedBy: ['G2'], classes: [] },
                G2: { supportedBy: ['G3'], classes: [] },
                G3: { supportedBy: ['Sn1'], classes: [] },
                Sn1: { supportedBy: [], classes: [] },
            });

            const inputYamlPath = '/path/to/input.yaml';
            const outputYamlPath = '/path/to/output.yaml';

            fs.readFileSync.mockReturnValueOnce(JSON.stringify(yamlContent));

            // Invoke the script
            require('../yaml_pruner');

            const updatedYamlContent = yaml.dump.mock.calls[0][0];

            // Validate horizontalIndex property
            expect(updatedYamlContent.G1.horizontalIndex.absolute).toBe(0);
            expect(updatedYamlContent.G2.horizontalIndex.absolute).toBe(1);
            expect(updatedYamlContent.G3.horizontalIndex.absolute).toBe(2);
        });
    });

    describe('Integration Tests', () => {
        it('should process the YAML and write a pruned version to the output file', () => {
            yaml.load.mockReturnValue(yamlContent);

            const inputYamlPath = '/path/to/input.yaml';
            const outputYamlPath = '/path/to/output.yaml';

            fs.readFileSync.mockReturnValueOnce(JSON.stringify(yamlContent));

            // Invoke the script
            require('../yaml_pruner');

            expect(fs.readFileSync).toHaveBeenCalledWith(inputYamlPath, 'utf8');
            expect(yaml.dump).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputYamlPath, expect.any(String), 'utf8');
        });
    });
});
