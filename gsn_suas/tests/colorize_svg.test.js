const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Mock `fs` and `JSDOM`
jest.mock('fs');
jest.mock('jsdom');

// Mock implementations for `fs`
fs.readFile = jest.fn((filePath, encoding, callback) => {
    if (filePath.endsWith('.svg')) {
        // Return a mock SVG string
        const mockSvg = `
<svg>
    <g class="gsnelem low-risk">
        <path class="border" fill="red" stroke="black" fill-opacity="0.5" stroke-width="2"></path>
        <text fill="blue">Low Risk</text>
    </g>
    <g class="gsnelem high-risk">
        <path class="border" fill="red" stroke="black" fill-opacity="0.5" stroke-width="2"></path>
        <text fill="blue">High Risk</text>
    </g>
</svg>`;
        callback(null, mockSvg);
    } else if (filePath.endsWith('.css')) {
        // Return a mock CSS string
        callback(null, '.gsnelem { stroke-width: 2; }');
    } else {
        callback(new Error(`Unknown file path: ${filePath}`));
    }
});

fs.writeFile = jest.fn((filePath, data, encoding, callback) => {
    callback(null); // Simulate a successful write
});

fs.existsSync = jest.fn((dirPath) => {
    return dirPath.includes('images'); // Assume the 'images' directory exists
});

fs.mkdirSync = jest.fn(); // Mock mkdirSync

// Mock `JSDOM` behavior
JSDOM.mockImplementation((html) => {
    const dom = new JSDOM(html);
    return {
        window: dom.window,
        document: dom.window.document,
    };
});

// Import the script to test
require('../colorize_svg');

describe('colorize_svg.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should read an SVG file and modify risk levels', (done) => {
        const mockInputPath = '/path/to/mock_input.svg';
        const mockOutputPath = '/path/to/mock_output.svg';

        // Simulate the SVG file modification
        require('../colorize_svg');

        // Assertions
        expect(fs.readFile).toHaveBeenCalledWith(mockInputPath, 'utf8', expect.any(Function));
        expect(fs.readFile).toHaveBeenCalledWith(expect.stringMatching(/suas\.gsn\.css$/), 'utf8', expect.any(Function));

        // Verify that writeFile was called with modified SVG content
        setImmediate(() => {
            expect(fs.writeFile).toHaveBeenCalledWith(
                mockOutputPath,
                expect.stringContaining('<style><![CDATA['),
                'utf8',
                expect.any(Function)
            );
            done();
        });
    });

    it('should add CSS content to the SVG', (done) => {
        const mockCssPath = '/path/to/suas.gsn.css';
        const mockInputPath = '/path/to/mock_input.svg';
        const mockOutputPath = '/path/to/mock_output.svg';

        fs.readFile.mockImplementationOnce((filePath, encoding, callback) => {
            if (filePath === mockCssPath) {
                callback(null, '.gsnelem { stroke-width: 2; }');
            } else if (filePath === mockInputPath) {
                callback(null, `
<svg>
    <g class="gsnelem low-risk"></g>
</svg>`);
            }
        });

        // Simulate the SVG file modification
        require('../colorize_svg');

        setImmediate(() => {
            // Ensure CSS is injected into the SVG
            expect(fs.writeFile).toHaveBeenCalledWith(
                mockOutputPath,
                expect.stringContaining('<style><![CDATA['),
                'utf8',
                expect.any(Function)
            );
            done();
        });
    });

    it('should handle errors when reading the SVG file', (done) => {
        fs.readFile.mockImplementationOnce((filePath, encoding, callback) => {
            callback(new Error('Error reading SVG file'));
        });

        // Simulate the SVG file modification
        require('../colorize_svg');

        setImmediate(() => {
            // Verify no writeFile calls were made
            expect(fs.writeFile).not.toHaveBeenCalled();
            done();
        });
    });

    it('should handle errors when writing the modified SVG file', (done) => {
        const mockInputPath = '/path/to/mock_input.svg';
        const mockOutputPath = '/path/to/mock_output.svg';

        fs.writeFile.mockImplementationOnce((filePath, data, encoding, callback) => {
            callback(new Error('Error writing modified SVG file'));
        });

        // Simulate the SVG file modification
        require('../colorize_svg');

        setImmediate(() => {
            // Verify writeFile was called and errored
            expect(fs.writeFile).toHaveBeenCalledWith(
                mockOutputPath,
                expect.any(String),
                'utf8',
                expect.any(Function)
            );
            done();
        });
    });
});
