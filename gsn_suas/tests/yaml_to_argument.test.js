const fs = require('fs');
const yaml = require('js-yaml');

// Mock the file system and YAML modules
jest.mock('fs');
jest.mock('js-yaml');

// Mock implementations for `fs` and `yaml`
fs.readFileSync = jest.fn((filePath) => {
    if (filePath.endsWith('.yaml')) {
        return `
G1:
  text: "Top Level Goal"
  supportedBy: ["G2"]
  classes: []
G2:
  text: "Sub Goal"
  supportedBy: ["Sn1"]
  inContextOf: ["C1"]
  classes: []
Sn1:
  text: "Solution Node"
  classes: []
C1:
  text: "Context Node"
  classes: []
`;
    }
    throw new Error(`Unknown file path: ${filePath}`);
});

fs.writeFileSync = jest.fn((filePath, data) => {
    console.log(`Mock write to ${filePath}:\n${data}`);
});

yaml.load = jest.fn((data) => {
    if (typeof data === 'string' && data.trim().startsWith('G1:')) {
        return {
            G1: { text: "Top Level Goal", supportedBy: ["G2"], classes: [] },
            G2: { text: "Sub Goal", supportedBy: ["Sn1"], inContextOf: ["C1"], classes: [] },
            Sn1: { text: "Solution Node", classes: [] },
            C1: { text: "Context Node", classes: [] },
        };
    }
    throw new Error('Invalid YAML format');
});

// Import the script to test
require('../yaml_to_argument');

describe('yaml_to_argument.js', () => {
    let inputYamlPath, outputArgumentPath;

    beforeEach(() => {
        jest.clearAllMocks();
        inputYamlPath = '/path/to/input.yaml';
        outputArgumentPath = '/path/to/output.argument';
    });

    it('should process YAML and generate the correct .argument file content', () => {
        // Mock input YAML content
        yaml.load.mockReturnValueOnce({
            G1: { text: "Top Level Goal", supportedBy: ["G2"], classes: [] },
            G2: { text: "Sub Goal", supportedBy: ["Sn1"], inContextOf: ["C1"], classes: [] },
            Sn1: { text: "Solution Node", classes: [] },
            C1: { text: "Context Node", classes: [] },
        });

        fs.readFileSync.mockReturnValueOnce(`
G1:
  text: "Top Level Goal"
  supportedBy: ["G2"]
  classes: []
G2:
  text: "Sub Goal"
  supportedBy: ["Sn1"]
  inContextOf: ["C1"]
  classes: []
Sn1:
  text: "Solution Node"
  classes: []
C1:
  text: "Context Node"
  classes: []
`);

        // Mock output directory creation
        fs.writeFileSync.mockImplementation(() => {});

        // Import the script to run it
        require('../yaml_to_argument');

        // Verify the file was read and parsed
        expect(fs.readFileSync).toHaveBeenCalledWith(inputYamlPath, 'utf8');
        expect(yaml.load).toHaveBeenCalled();

        // Verify the output file was written with the expected content
        const writtenContent = fs.writeFileSync.mock.calls[0][1];
        expect(writtenContent).toContain('Argument 1.3 Generated_Argument');
        expect(writtenContent).toContain('Goal G1');
        expect(writtenContent).toContain('description "Top Level Goal"');
        expect(writtenContent).toContain('IsSupportedBy ISB_G1_G2');
        expect(writtenContent).toContain('to G2 from G1');
        expect(writtenContent).toContain('InContextOf ICO_G2_C1');
        expect(writtenContent).toContain('to C1 from G2');
    });

    it('should handle missing nodes gracefully', () => {
        yaml.load.mockReturnValueOnce({
            G1: { text: "Top Level Goal", supportedBy: ["G2"], classes: [] },
            G2: { text: "Sub Goal", supportedBy: ["Sn1"], classes: [] },
        });

        fs.readFileSync.mockReturnValueOnce(`
G1:
  text: "Top Level Goal"
  supportedBy: ["G2"]
  classes: []
G2:
  text: "Sub Goal"
  supportedBy: ["Sn1"]
  classes: []
`);

        // Mock output directory creation
        fs.writeFileSync.mockImplementation(() => {});

        require('../yaml_to_argument');

        const writtenContent = fs.writeFileSync.mock.calls[0][1];
        expect(writtenContent).toContain('Argument 1.3 Generated_Argument');
        expect(writtenContent).toContain('Goal G1');
        expect(writtenContent).toContain('description "Top Level Goal"');
        expect(writtenContent).toContain('IsSupportedBy ISB_G1_G2');
        expect(writtenContent).toContain('to G2 from G1');
        expect(writtenContent).not.toContain('to C1 from G2'); // C1 is missing
    });

    it('should throw an error if YAML file cannot be read', () => {
        fs.readFileSync.mockImplementationOnce(() => {
            throw new Error('File not found');
        });

        expect(() => require('../yaml_to_argument')).toThrow('File not found');
    });

    it('should throw an error if output directory cannot be created', () => {
        fs.mkdirSync.mockImplementationOnce(() => {
            throw new Error('Permission denied');
        });

        expect(() => require('../yaml_to_argument')).toThrow('Permission denied');
    });
});
