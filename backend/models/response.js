const mongoose = require('mongoose');

/**
 * Mongoose schema for storing responses to questions.
 * Represents a single response with details about the question and its answer.
 */
const responseSchema = new mongoose.Schema({
    questionName: String,
    questionText: String,
    answer: String
});

/**
 * Mongoose model for the response schema.
 * @module Response
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('Response', responseSchema);