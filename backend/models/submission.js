const mongoose = require('mongoose');

/**
 * Mongoose schema for storing submissions.
 * Represents a collection of responses and a timestamp indicating when the submission occurred.
 */
const submissionSchema = new mongoose.Schema({
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Response' }],
    timestamp: String
});

/**
 * Mongoose model for the submission schema.
 * @module Submission
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('Submission', submissionSchema);