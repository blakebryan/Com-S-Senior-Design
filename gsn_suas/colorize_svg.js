/**
 * @file svg_risk_level_modifier.js
 * Modifies SVG files to update styles and classes based on risk levels.
 * The script reads an input SVG, applies risk level-based updates, and saves the modified SVG.
 * @author Brady Bargren. ISU ID: az2997
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * The timestamp for naming input/output files, passed as a command-line argument.
 * @type {string}
 */
const timestamp = process.argv[2];

/**
 * Optional flag to indicate whether the input SVG is "pruned".
 * If specified as 'pruned', the script processes pruned SVG files.
 * @type {string|undefined}
 */
const prunedFlag = process.argv[3];

// Ensure the images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

/**
 * Reads an SVG file, modifies it to include styles based on risk levels, and writes the modified SVG to a file.
 *
 * @param {string} svgFilePath - The path to the input SVG file.
 * @param {string} outputSvgPath - The path to save the modified SVG file.
 */
const applyClassesToSvg = (svgFilePath, outputSvgPath) => {
    fs.readFile(svgFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading SVG file:', err);
            return;
        }

        const dom = new JSDOM(data);
        const document = dom.window.document;

        // Get all elements with class 'gsnelem' (assuming these represent GSN nodes)
        const nodes = document.querySelectorAll('.gsnelem');

        nodes.forEach(node => {
            // Get the class list of the node
            const classList = node.classList;

            // Check for risk level classes and remove conflicting styles
            if (classList.contains('low-risk') || classList.contains('moderate-risk') || classList.contains('high-risk')) {
                const pathElem = node.querySelector('path.border');
                if (pathElem) {
                    pathElem.removeAttribute('fill');
                    pathElem.removeAttribute('stroke');
                    pathElem.removeAttribute('fill-opacity');
                    pathElem.removeAttribute('stroke-width');
                }

                // Remove inline styles from text and anchor elements
                const textElements = node.querySelectorAll('text, a');
                textElements.forEach(textEl => {
                    textEl.removeAttribute('fill');
                });
            }
        });

        // Include CSS in the SVG file
        const svgElement = document.querySelector('svg');
        if (svgElement) {
            const styleElement = document.createElement('style');
            const cssFilePath = path.join(__dirname, 'suas.gsn.css');
            const cssContent = fs.readFileSync(cssFilePath, 'utf8');
            styleElement.textContent = `<![CDATA[\n${cssContent}\n]]>`;
            svgElement.insertBefore(styleElement, svgElement.firstChild);

            // Serialize the modified SVG and save it to the specified path
            const modifiedSvg = svgElement.outerHTML;
            fs.writeFile(outputSvgPath, modifiedSvg, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing modified SVG file:', err);
                } else {
                    console.log(`Modified SVG file saved at ${outputSvgPath}`);
                }
            });
        } else {
            console.error('No <svg> element found in the SVG file.');
        }
    });
};

/**
 * Array of objects representing the input and output paths for SVG files to be processed.
 * If the "pruned" flag is set, it processes pruned SVGs.
 * Otherwise, it processes the default SVG.
 * @type {Array<{input: string, output: string}>}
 */
let svgFiles = [];

if (prunedFlag === 'pruned') {
    svgFiles.push({
        input: path.join(imagesDir, `safety_case_${timestamp}_pruned.gsn.svg`),
        output: path.join(imagesDir, `safety_case_color_${timestamp}_pruned.gsn.svg`),
    });
} else {
    svgFiles = [
        {
            input: path.join(imagesDir, `safety_case_${timestamp}.gsn.svg`),
            output: path.join(imagesDir, `safety_case_color_${timestamp}.gsn.svg`),
        },
    ];
}

// Process each SVG file in the list
svgFiles.forEach(({ input, output }) => {
    applyClassesToSvg(input, output);
});

module.exports = {
    applyClassesToSvg,
};
