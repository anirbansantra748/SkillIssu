//made a schema have daily question store in a array
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dailyQuestionSchema = new Schema({
    date: { type: Date, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Problem' }]

})
module.exports = mongoose.model('DailyQuestion', dailyQuestionSchema);
