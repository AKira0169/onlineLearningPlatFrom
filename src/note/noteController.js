const Note = require('./noteModel');
const AppError = require('../../utils/appError');

exports.createNote = async (req, res, next) => {
  const { note } = req.body;
  const newNote = new Note({
    note,
  });
  await newNote.save();
  res.status(201).json({
    status: 'success',
    data: newNote,
  });
};

exports.getNotes = async (req, res, next) => {
  const notes = await Note.find();
  res.status(200).json({
    status: 'success',
    results: notes.length,
    data: {
      notes,
    },
  });
};
exports.view = async (req, res, next) => {
  const notes = await Note.find();

  res.render('index', {
    notes,
  });
};
