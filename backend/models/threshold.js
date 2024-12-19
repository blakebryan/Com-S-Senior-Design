const mongoose = require('mongoose');

/**
 * Mongoose schema for storing threshold values for various models.
 */
const thresholdSchema = new mongoose.Schema({
    /**
     * The name of the model.
     * @type {string}
     */
    model: String,

    /**
     * The maximum wind speed the model can handle.
     * @type {string}
     */
    maxWind: String,

    /**
     * The maximum density altitude the model can handle.
     * @type {string}
     */
    maxDensity: String,

    /**
     * The maximum weight the model can handle.
     * @type {string}
     */
    maxWeight: String,
});

/**
 * Mongoose model for the threshold schema.
 * @type {mongoose.Model}
 */
const thresholdsModel = mongoose.model('Threshold', thresholdSchema);

/**
 * Retrieves the thresholds for a specific model.
 *
 * @async
 * @function getThresholdsFor
 * @param {string} model - The name of the model.
 * @returns {Promise<Object|null>} The threshold document for the specified model, or `null` if not found.
 */
async function getThresholdsFor(model) {
    try {
        return await thresholdsModel.findOne({ model: model }, "model maxWind maxDensity maxWeight");
    } catch (err) {
        console.log(err);
    }
}

/**
 * Deletes the thresholds for a specific model.
 *
 * @async
 * @function deleteThreshold
 * @param {string} model - The name of the model.
 * @returns {Promise<Object|null>} The deleted threshold document, or `null` if no document was found.
 */
async function deleteThreshold(model) {
    try {
        return await thresholdsModel.findOneAndDelete({ model: model });
    } catch (err) {
        console.log(err);
    }
}

/**
 * Sets the thresholds for a specific model.
 *
 * @async
 * @function setThresholdsFor
 * @param {string} model - The name of the model.
 * @param {Object} thresholds - An object containing threshold values.
 * @param {string} thresholds.maxWind - The maximum wind speed.
 * @param {string} thresholds.maxDensity - The maximum density altitude.
 * @param {string} thresholds.maxWeight - The maximum weight.
 * @returns {Promise<void>} Resolves when the threshold is saved.
 */
async function setThresholdsFor(model, { maxWind, maxDensity, maxWeight }) {
    try {
        await (await thresholdsModel.create({ model, maxWind, maxDensity, maxWeight })).save();
    } catch (err) {
        console.log(err);
    }
}

/**
 * Retrieves all thresholds for all models.
 *
 * @async
 * @function getThresholds
 * @returns {Promise<Array<Object>>} An array of all threshold documents.
 */
async function getThresholds() {
    return await thresholdsModel.find({});
}

module.exports = { getThresholds, getThresholdsFor, setThresholdsFor, deleteThreshold };
