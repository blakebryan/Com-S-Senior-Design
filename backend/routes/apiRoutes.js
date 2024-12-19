/**
 * @file apiRoutes.js
 * This file defines the routes for the Express server, including endpoints for safety case generation,
 * fetching and saving responses, handling thresholds, and more.
 */

const express = require('express');
require('dotenv').config()
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os'); // For OS-based logic in generate-safety-case
const axios = require('axios'); // For handling external API requests

// Controllers
const { generateQuestions, parseQuestionTree } = require('../controllers/questionController');
const { saveResponses, getResponses } = require('../controllers/responseController');
const { saveSafetyCaseMarked, getSafetyCaseMarked, savePrunedTree, getPrunedSafetyCaseMarked } = require('../controllers/treeDataController');

// Utilities
const parseArgsFile = require('../utils/argReader');
const { processFileContent } = require('../utils/argsParser');
const { mapResponseToGoal } = require('../utils/goalCheck');

// Models
const { getThresholds, setThresholdsFor, deleteThreshold } = require('../models/threshold.js');
const { ArgumentTree } = require('../models/argumentTreeModel');

let cachedQuestions = null;
let parsedQuestions = null;

const router = express.Router();

/**
 * Handles and logs errors during route execution.
 *
 * @param {Object} res - The Express response object.
 * @param {string} errorMessage - A message describing the error.
 * @param {Error} error - The error object.
 * @returns {Object} The response with a 500 status and error message.
 */
function handleError(res, errorMessage, error) {
    console.error(errorMessage, error);
    return res.status(500).json({ message: errorMessage, error: error.toString() });
}

// ----- Endpoints -----

/**
 * GET /model
 * Generates and caches a set of questions if not already cached, then returns them.
 */
router.get('/model', async (req, res) => {
    console.log("[model] model endpoint hit with method:", req.method);
    try {
        if (cachedQuestions == null) {
            console.log("GENERATING NEW QUESTION SET!!!");
            cachedQuestions = await generateQuestions("./tests/test_data/test_and_or_alt_model.xml");
            //cachedQuestions = await generateQuestions(process.env.MODEL_XML);
            console.log("New question set generated:", JSON.stringify(cachedQuestions, null, 2));
        } else {
            console.log("Using cached questions.");
        }
        console.log("[model] Returning question set.");
        res.status(200).json(cachedQuestions);
    } catch (error) {
        return handleError(res, "Error generating questions", error);
    }
});

/**
 * POST /submit
 * Submits user answers, processes them, saves the responses, and generates a marked safety case.
 * Optionally prunes the tree based on failures.
 */
router.post('/submit', async (req, res) => {
    const answers = req.body;
    console.log("[submit] In the submit call with answers:", answers);
    try {
        const tree = cachedQuestions;
        if (tree == null) {
            console.warn("[submit] No questions have been generated yet. Returning early.");
            return res.status(200).json({ message: 'no questions have been generated from model endpoint' });
        }

        console.log("[submit] Parsing questions...");
        const parsedQuestions = await parseQuestionTree(tree.questionSet);
        console.log("[submit] Saving responses...");
        await saveResponses(answers, parsedQuestions);

        console.log("[submit] Mapping responses to goal...");
        const fileParseArgs = "../test_files/par_gsn.argument";
        const markedTree = await mapResponseToGoal(answers, fileParseArgs);
        console.log("[submit] Saving the marked safety case...");
        await saveSafetyCaseMarked(markedTree);

        try {
            console.log("[submit] Attempting to prune the failure tree...");
            const prunedTree = markedTree.getPrunedFailureTree();
            console.log("[submit] Pruned tree created:", prunedTree !== null);
            console.log("[submit] Pruned tree structure:", JSON.stringify(prunedTree, null, 2));
            console.log("[submit] Saving pruned tree...");
            await savePrunedTree(prunedTree);
            console.log("[submit] Saved pruned tree successfully.");
        } catch (innerError) {
            console.error("[submit] Error in pruning or saving pruned tree:", innerError);
        }

        console.log("[submit] End of submit request, returning success.");
        res.status(200).json({ message: 'Form submitted successfully' });
    } catch (error) {
        return handleError(res, "Error saving responses during submit", error);
    }
});

/**
 * GET /responses
 * Fetches user responses from the database.
 */
router.get('/responses', async (req, res) => {
    console.log("[responses] Fetching responses from database...");
    try {
        const responses = await getResponses();
        console.log("[responses] Successfully fetched responses:", responses);
        res.status(200).json(responses);
    } catch (error) {
        return handleError(res, "Error retrieving responses", error);
    }
});

/**
 * GET /safety-case-data
 * Retrieves the saved marked safety case data.
 */
router.get('/safety-case-data', async (req, res) => {
    console.log("[safety-case-data] Fetching the Safety Case data...");
    try {
        const safetyCaseData = await getSafetyCaseMarked();
        console.log("[safety-case-data] Data retrieved:", safetyCaseData);
        res.status(200).json(safetyCaseData || {});
    } catch (error) {
        return handleError(res, "Error retrieving safety case data", error);
    }
});

/**
 * GET /pruned-safety-case-data
 * Retrieves the pruned safety case data.
 */
router.get('/pruned-safety-case-data', async (req, res) => {
    console.log("[pruned-safety-case-data] Fetching the Pruned Safety Case data...");
    try {
        const prunedSafetyCaseData = await getPrunedSafetyCaseMarked();
        console.log("[pruned-safety-case-data] Data retrieved:", prunedSafetyCaseData);
        res.status(200).json(prunedSafetyCaseData || {});
        console.log("[pruned-safety-case-data] End of endpoint.");
    } catch (error) {
        return handleError(res, "Error retrieving pruned safety case data", error);
    }
});

/**
 * Endpoint to upload and save an SVG file.
 */
router.post("/upload-svg", (req, res) => {
    const svg_data = req.body;
    console.log("[upload-svg] Received SVG data:", svg_data);

    if (!svg_data) {
        console.error("[upload-svg] No SVG data provided in request.");
        return res.status(400).json({ message: "No SVG data provided" });
    }

    const filePath = path.join(__dirname, "..", "uploads", `${svg_data.type}.svg`);
    console.log("[upload-svg] Writing SVG to:", filePath);
    fs.writeFile(filePath, svg_data.svg, (err) => {
        if (err) {
            console.error("Error saving SVG:", err);
            return res.status(500).json({ message: "Failed to save SVG", error: err.toString() });
        }
        console.log("[upload-svg] SVG saved successfully at:", filePath);
        res.json({ message: "SVG saved successfully", filePath });
    });
});

/**
 * Endpoint to fetch NOTAMs for a specific location.
 */
router.get('/notams', async (req, res) => {
    console.log("[notams] Fetching NOTAMs for location:", req.query.loc);
    try {
        const { data } = await axios({
            method: 'get',
            url: 'https://external-api.faa.gov/notamapi/v1/notams?domesticLocation=' + req.query.loc,
            headers: {
                'client_id': '27c12f3a02684c8c8db84c6bd07f031d',
                'client_secret': 'fc51B75f004c40529A310ab4b7799A76'
            }
        });
        console.log("[notams] Received data:", data);
        res.json(data);
    } catch (error) {
        return handleError(res, "Error fetching NOTAMs", error);
    }
});

/**
 * Endpoint to fetch threshold limits for different models.
 */
router.get('/admin/limits', async (req, res) => {
    console.log("[admin/limits] Fetching thresholds...");
    try {
        const thresholds = await getThresholds();
        const resTranslated = thresholds.map((e) => {
            return { model: e.model, maxWind: e.maxWind, maxDensity: e.maxDensity, maxWeight: e.maxWeight };
        });
        console.log("[admin/limits] Returning thresholds:", resTranslated);
        res.status(200).json(resTranslated);
    } catch (error) {
        return handleError(res, "Error retrieving admin limits", error);
    }
});

/**
 * Endpoint to add a new model threshold.
 */
router.post('/admin/add', async (req, res) => {
    console.log("[admin/add] Adding new threshold for model:", req.body.model);
    try {
        await setThresholdsFor(req.body.model, { maxWind: 0, maxDensity: 0, maxWeight: 0 });
        const updated = await getThresholds();
        console.log("[admin/add] Thresholds after addition:", updated);
        res.status(200).json(updated);
    } catch (error) {
        return handleError(res, "Error adding admin threshold", error);
    }
});

/**
 * Endpoint to update an existing model threshold.
 */
router.post('/admin/update', async (req, res) => {
    console.log("[admin/update] Updating threshold for model:", req.body.make);
    try {
        await setThresholdsFor(req.body.make, { maxWind: req.body.maxWind, maxDensity: req.body.maxDensity, maxWeight: req.body.maxWeight });
        const updated = await getThresholds();
        console.log("[admin/update] Thresholds after update:", updated);
        res.status(200).json(updated);
    } catch (error) {
        return handleError(res, "Error updating admin threshold", error);
    }
});

/**
 * Endpoint to delete a model threshold.
 */
router.post('/admin/delete', async (req, res) => {
    console.log("[admin/delete] Deleting threshold for model:", req.body.make);
    try {
        await deleteThreshold(req.body.make);
        const updated = await getThresholds();
        console.log("[admin/delete] Thresholds after deletion:", updated);
        res.status(200).json(updated);
    } catch (error) {
        return handleError(res, "Error deleting admin threshold", error);
    }
});

router.get('/proxy/locs', async (req, res) => {
    console.log("[proxy/locs] Searching for locations with query:", req.query.search);
    try {
        const { data } = await axios.get('https://notams.aim.faa.gov/notamSearch/locs?search=' + req.query.search);
        console.log("[proxy/locs] Data received:", data);
        res.json(data);
    } catch (error) {
        return handleError(res, "Error proxying location data", error);
    }
});

/**
 * GET /download-argument/:timestamp
 * Serves the argument file for the given timestamp.
 */
router.get('/download-argument/:timestamp', (req, res) => {
    const timestamp = req.params.timestamp;
    const argumentFilePath = path.join(__dirname, '../../gsn_suas/output arguments', `safety_case_${timestamp}.argument`);

    if (fs.existsSync(argumentFilePath)) {
        res.download(argumentFilePath, `safety_case_${timestamp}.argument`, (err) => {
            if (err) {
                console.error('Error sending argument file:', err);
                res.status(500).send('Error sending argument file.');
            }
        });
    } else {
        res.status(404).send('Argument file not found.');
    }
});

/**
 * GET /download-safety-case-data
 * Serves the `safetyCaseData.json` file.
 */
router.get('/download-safety-case-data', (req, res) => {
    const filePath = path.join(__dirname, '../exports/safetyCaseData.json');
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'safetyCaseData.json', (err) => {
            if (err) {
                console.error('Error sending Safety Case Data JSON file:', err);
                res.status(500).send('Error sending Safety Case Data file.');
            }
        });
    } else {
        res.status(404).send('Safety Case Data file not found.');
    }
});

/**
 * GET /download-pruned-case-data
 * Serves the `prunedCaseData.json` file.
 */
router.get('/download-pruned-case-data', (req, res) => {
    const filePath = path.join(__dirname, '../exports/prunedCaseData.json');
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'prunedCaseData.json', (err) => {
            if (err) {
                console.error('Error sending Pruned Case Data JSON file:', err);
                res.status(500).send('Error sending Pruned Case Data file.');
            }
        });
    } else {
        res.status(404).send('Pruned Case Data file not found.');
    }
});

/**
 * POST /generate-safety-case
 * Generates a safety case and its associated files.
 * Handles SVG generation, coloring, and pruning.
 */
router.post('/generate-safety-case', (req, res) => {
    console.log('Received request to generate safety case...');
    const gsnSuasDir = path.join(__dirname, '../../gsn_suas');

    // Detect the operating system
    const platform = os.platform(); // 'win32', 'darwin', 'linux'

    // Set the gsn2x executable based on the platform
    let gsn2xExecutable = '';
    if (platform === 'win32') {
        gsn2xExecutable = 'gsn2x.exe';
    } else if (platform === 'darwin' || platform === 'linux') {
        gsn2xExecutable = 'gsn2x';
    } else {
        gsn2xExecutable = 'gsn2x';
    }

    const gsn2xPath = path.join(gsnSuasDir, gsn2xExecutable);

    const timestamp = req.body.timestamp;
    const imagesDir = path.join(gsnSuasDir, 'images');

    const safetyCaseSvgPath = path.join(imagesDir, `safety_case_color_${timestamp}.gsn.svg`);

    // Check if safety case SVG already exists
    if (fs.existsSync(safetyCaseSvgPath)) {
        // If SVGs exist, return their paths without regenerating
        return res.status(200).json({
            message: 'Safety cases already exist',
            svgPaths: {
                // 'suas' removed
                safetyCase: `/gsn_suas/images/safety_case_color_${timestamp}.gsn.svg`,
                prunedSafetyCase: `/gsn_suas/images/safety_case_color_${timestamp}_pruned.gsn.svg`,
            },
        });
    } else {
        // Proceed with generation if SVG does not exist
        // Generate YAML and argument files for safety case only
        exec(
            `node json_xml_to_yaml.js ${timestamp}`,
            { cwd: gsnSuasDir, shell: true },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error generating YAML files: ${stderr}`);
                    return res.status(500).json({ message: 'Error generating YAML files', error: stderr });
                }
                console.log('YAML files generated successfully:', stdout);

                const safetyCaseYamlPath = path.join(imagesDir, `safety_case_${timestamp}.gsn.yaml`);
                const outputArgumentsDir = path.join(gsnSuasDir, 'output arguments');

                // Ensure the output arguments directory exists
                if (!fs.existsSync(outputArgumentsDir)) {
                    fs.mkdirSync(outputArgumentsDir, { recursive: true });
                }

                const outputArgumentPath = path.join(outputArgumentsDir, `safety_case_${timestamp}.argument`);

                exec(
                    `node yaml_to_argument.js "${safetyCaseYamlPath}" "${outputArgumentPath}"`,
                    { cwd: gsnSuasDir, shell: true },
                    (errorYaml, stdoutYaml, stderrYaml) => {
                        if (errorYaml) {
                            console.error(`Error converting YAML to argument file: ${stderrYaml}`);
                            return res.status(500).json({ message: 'Error converting YAML to argument file', error: stderrYaml });
                        }
                        console.log('Argument file generated successfully:', stdoutYaml);

                        // Generate 'safety case' SVG only
                        exec(
                            `"${gsn2xPath}" "./images/safety_case_${timestamp}.gsn.yaml"`,
                            { cwd: gsnSuasDir, shell: true },
                            (errorSafety, stdoutSafety, stderrSafety) => {
                                if (errorSafety) {
                                    console.error(`Error generating safety case SVG: ${stderrSafety}`);
                                    return res.status(500).json({ message: 'Error generating safety case SVG', error: stderrSafety });
                                }
                                console.log('Safety case SVG generated successfully:', stdoutSafety);

                                // Run the colorize_svg.js script
                                exec(
                                    `node colorize_svg.js ${timestamp}`,
                                    { cwd: gsnSuasDir, shell: true },
                                    (error3, stdout3, stderr3) => {
                                        if (error3) {
                                            console.error(`Error colorizing safety case SVGs: ${stderr3}`);
                                            return res.status(500).json({ message: 'Error colorizing safety case', error: stderr3 });
                                        }
                                        console.log('Safety case SVGs colorized successfully:', stdout3);

                                        // Now, run the yaml_pruner.js script to create the pruned YAML
                                        const prunedYamlPath = path.join(imagesDir, `safety_case_${timestamp}_pruned.gsn.yaml`);

                                        exec(
                                            `node yaml_pruner.js "${safetyCaseYamlPath}" "${prunedYamlPath}"`,
                                            { cwd: gsnSuasDir, shell: true },
                                            (errorPrune, stdoutPrune, stderrPrune) => {
                                                if (errorPrune) {
                                                    console.error(`Error pruning YAML file: ${stderrPrune}`);
                                                    // Not returning error as pruned is optional
                                                } else {
                                                    console.log('Pruned YAML file generated successfully:', stdoutPrune);

                                                    exec(
                                                        `"${gsn2xPath}" "${prunedYamlPath}" -o "${imagesDir}"`,
                                                        { cwd: gsnSuasDir, shell: true },
                                                        (errorPrunedSvg, stdoutPrunedSvg, stderrPrunedSvg) => {
                                                            if (errorPrunedSvg) {
                                                                console.error(`Error generating pruned safety case SVG: ${stderrPrunedSvg}`);
                                                                // Not returning error as pruned is optional
                                                            } else {
                                                                console.log('Pruned safety case SVG generated successfully:', stdoutPrunedSvg);

                                                                // Run the colorize_svg.js script on the pruned SVG
                                                                exec(
                                                                    `node colorize_svg.js ${timestamp} pruned`,
                                                                    { cwd: gsnSuasDir, shell: true },
                                                                    (errorColorizePruned, stdoutColorizePruned, stderrColorizePruned) => {
                                                                        if (errorColorizePruned) {
                                                                            console.error(`Error colorizing pruned safety case SVG: ${stderrColorizePruned}`);
                                                                            // Not returning error, optional
                                                                        } else {
                                                                            console.log('Pruned safety case SVG colorized successfully:', stdoutColorizePruned);
                                                                        }

                                                                        // Send back the paths to the generated and colorized SVG files, no SUAS file
                                                                        res.status(200).json({
                                                                            message: 'Safety case generated and colorized successfully',
                                                                            svgPaths: {
                                                                                safetyCase: `/gsn_suas/images/safety_case_color_${timestamp}.gsn.svg`,
                                                                                prunedSafetyCase: `/gsn_suas/images/safety_case_color_${timestamp}_pruned.gsn.svg`,
                                                                            },
                                                                        });
                                                                    }
                                                                );
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }
});

/**
 * Endpoint to parse argument files and build a tree structure.
 */
router.get('/parse-args', async (req, res) => {
    try {
        const fileParseArgs = "../test_files/test.argument";
        const argData = await processFileContent(fileParseArgs)
        const argTree = new ArgumentTree()
        argTree.buildTree(argData)
        const tree = argTree.toJSON()
        console.log(tree)
        res.status(200).json(tree);
    } catch (error) {
        console.error("Error parsing args", error);
        res.status(500).send('Error parsing args');
    }
});

module.exports = router;