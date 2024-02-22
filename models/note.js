const mongoose = require('mongoose')
const Schema = mongoose.Schema
const noteSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

const Note = mongoose.model('Note', noteSchema)
module.exports = Note
