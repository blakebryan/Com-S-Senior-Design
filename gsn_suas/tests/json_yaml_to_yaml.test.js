const fs = require('fs');
const yaml = require('js-yaml');
const mongoose = require('mongoose');

// Mock the file system, YAML modules, and mongoose
jest.mock('fs');
jest.mock('js-yaml');
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    connection: { close: jest.fn() },
    Schema: jest.fn(() => ({})),
    model: jest.fn(() => ({
        find: jest.fn(() => ({
            exec: jest.fn().mockResolvedValue([
                { questionName: 'Flight_Hours', answer: 'BetweenNplus1AndM' },
                { questionName: 'Simulation_Hours', answer: 'None' },
                { questionName: 'Certifications', answer: 'CertOne' },
            ]),
        })),
    })),
}));

// Mock implementations for fs and yaml
fs.readFileSync = jest.fn((filePath) => {
    if (filePath.endsWith('.yaml')) {
        // Return a mock YAML template
        return `
G1:
  supportedBy:
    - S1
  classes: []
S1:
  supportedBy:
    - Sn2
    - Sn3
    - Sn4
  classes: []
Sn2:
  supportedBy: []
  classes: []
Sn3:
  supportedBy: []
  classes: []
Sn4:
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
            G1: { supportedBy: ['S1'], classes: [] },
            S1: { supportedBy: ['Sn2', 'Sn3', 'Sn4'], classes: [] },
            Sn2: { supportedBy: [], classes: [] },
            Sn3: { supportedBy: [], classes: [] },
            Sn4: { supportedBy: [], classes: [] },
        };
    }
    throw new Error('Invalid YAML format');
});

// Import the functions from the file being tested
const {
    loadResponsesFromDB,
    loadYamlTemplate,
    removeUnsupportedSn,
    updateYamlWithResponses,
    writeUpdatedYaml,
    updateYamlFileWithMongoData,
} = require('../json_yaml_to_yaml');

describe('json_yaml_to_yaml.js', () => {
    let yamlContent;
    const outputPath = '/path/to/output.yaml';
    const templatePath = '/path/to/template.yaml';

    beforeEach(() => {
        jest.clearAllMocks();

        yamlContent = {
            G1: { supportedBy: ['S1'], classes: [] },
            S1: { supportedBy: ['Sn2', 'Sn3', 'Sn4'], classes: [] },
            Sn2: { supportedBy: [], classes: [] },
            Sn3: { supportedBy: [], classes: [] },
            Sn4: { supportedBy: [], classes: [] },
        };
    });

    describe('loadYamlTemplate', () => {
        it('should load and parse a YAML template', () => {
            const result = loadYamlTemplate(templatePath);

            expect(fs.readFileSync).toHaveBeenCalledWith(templatePath, 'utf8');
            expect(yaml.load).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ G1: expect.any(Object) }));
        });

        it('should throw an error if the YAML template cannot be read', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            expect(() => loadYamlTemplate(templatePath)).toThrow('File not found');
        });
    });

    describe('removeUnsupportedSn', () => {
        it('should remove unsupported solution nodes from YAML content', () => {
            removeUnsupportedSn(yamlContent, 'S1', 'Sn3', ['Sn2', 'Sn3', 'Sn4']);

            expect(yamlContent.S1.supportedBy).toEqual(['Sn3']);
            expect(yamlContent.Sn2).toBeUndefined();
            expect(yamlContent.Sn4).toBeUndefined();
        });
    });

    describe('updateYamlWithResponses', () => {
        it('should update YAML content based on user responses', () => {
            const responses = [
                { questionName: 'Flight_Hours', answer: 'BetweenNplus1AndM' },
                { questionName: 'Simulation_Hours', answer: 'None' },
            ];

            const updatedContent = updateYamlWithResponses(yamlContent, responses);

            expect(updatedContent.S1.supportedBy).toEqual(['Sn3']);
            expect(updatedContent.Sn2).toBeUndefined();
            expect(updatedContent.Sn4).toBeUndefined();
        });
    });

    describe('writeUpdatedYaml', () => {
        it('should write updated YAML content to a file', () => {
            yaml.dump.mockReturnValue('mockYamlContent');
            writeUpdatedYaml(yamlContent, outputPath);

            expect(yaml.dump).toHaveBeenCalledWith(yamlContent);
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, 'mockYamlContent', 'utf8');
        });

        it('should throw an error if writing the file fails', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            expect(() => writeUpdatedYaml(yamlContent, outputPath)).toThrow('Write error');
        });
    });

    describe('Integration Tests', () => {
        it('should process user responses and write updated YAML', async () => {
            yaml.load.mockReturnValue(yamlContent);
            mongoose.model().find().exec.mockResolvedValue([
                { questionName: 'Flight_Hours', answer: 'BetweenNplus1AndM' },
            ]);

            await updateYamlFileWithMongoData(templatePath, outputPath);

            expect(fs.readFileSync).toHaveBeenCalledWith(templatePath, 'utf8');
            expect(yaml.dump).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, expect.any(String), 'utf8');
            expect(mongoose.connection.close).toHaveBeenCalled();
        });
    });
});
