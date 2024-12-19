const Response = require('../models/response');
const Submission = require('../models/submission');

/**
 * Saves responses to MongoDB. Each answer provided is matched with its corresponding question,
 * and the data is stored in the database. A timestamp is also saved as part of the submission.
 *
 * @async
 * @param {Object} answers - An object containing the answers, where the key is the question name, and the value is the response.
 * @param {Array<Object>} questions - An array of question objects, each containing a `name` and `text` property.
 * @throws {Error} If there is an error saving data to MongoDB.
 */
const saveResponses = async (answers, questions) => {
    try {
        const submission = await Submission.create({});
        for (const [key, value] of Object.entries(answers)) {
            // Handle timestamp separately
            if (key === 'timestamp') {
                submission.timestamp = value;
                continue;
            }
            const question = questions.find(q => q.name === key);
            if (question) {
                const response = await Response.create({
                    questionName: key,
                    questionText: question.text,
                    answer: value
                });
                submission.questions.push(response); // Add each response to the submission
                console.log(`Saved response: ${key} = ${value}`);
            } else {
                // Uncomment to log missing questions
                // console.warn(`No question found for key: ${key}`);
            }
        }
        await submission.save();
    } catch (error) {
        console.error('Error saving data to MongoDB:', error);
        throw new Error('Error saving data to MongoDB');
    }
};

/**
 * Retrieves all submissions from MongoDB, including the associated responses.
 *
 * @async
 * @returns {Promise<Array<Object>>} An array of submission objects, each populated with its associated questions.
 * @throws {Error} If there is an error retrieving data from MongoDB.
 */
const getResponses = async () => {
    try {
        // Retrieve all submissions and populate the questions field
        return await Submission.find().populate('questions');
    } catch (error) {
        console.error('Error retrieving data from MongoDB:', error);
        throw new Error('Error retrieving data from MongoDB');
    }
};

module.exports = { saveResponses, getResponses };
