const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Note = require("./models/note");
// connect to mongodb and listen for requests
require("dotenv").config();
// express app
const app = express();

const dbURI = process.env.DB_URI;
console.log("MongoDB URI:", dbURI); // 添加这一行进行调试
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Database connection established successfully");
  })
  .catch((err) => console.log(err));

// register view engine
app.set("view engine", "ejs");

// bring in static files
app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

// middleware for logging
app.use(recordMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/notes");
});

app.get("/notes", (req, res) => {
  Note.find()
    .sort({ date: -1 })
    .then((notes) => {
      const formattedNotes = notes.map((note) => {
        const formattedNote = note.toObject();
        formattedNote.formattedDate = formatDate(note.date);
        return formattedNote;
      });
      res.render("index", { storedNotes: formattedNotes });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving notes from database.");
    });
});

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

app.get("/notes/check-date/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const note = await Note.findOne({ date: new Date(date) });
    if (note) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking the note date." });
  }
});
app.get("/notes/check-date/:date/:noteId", async (req, res) => {
  const { date, noteId } = req.params;
  try {
    const existingNote = await Note.findOne({ date, _id: { $ne: noteId } });
    res.json({ exists: !!existingNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error checking for note date." });
  }
});

app.post("/notes", (req, res) => {
  const note = new Note({
    date: req.body.fdate,
    content: req.body.fnote,
  });

  note
    .save()
    .then((result) => {
      res.redirect("#notes");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.delete("/notes/:id", (req, res) => {
  const id = req.params.id;
  Note.findByIdAndDelete(id)
    .then((result) => {
      if (!result) return res.status(404).send("Note not found.");
      res.json({ message: "Note deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Unable to delete the note.");
    });
});

// Route to fetch data for a single note, returning JSON
app.get("/notes/:id", (req, res) => {
  const id = req.params.id;
  Note.findById(id)
    .then((note) => {
      if (!note) {
        return res.status(404).json({ error: "Note not found." });
      }
      res.json(note); // Return note data as JSON
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Error retrieving the note." });
    });
});

app.post("/notes/update/:id", express.json(), async (req, res) => {
  const id = req.params.id;
  const { content, date } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { content: content, date: new Date(date) },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found." });
    }

    res.json({
      success: true,
      message: "Note updated successfully",
      note: updatedNote,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Unable to update the note." });
  }
});

app.use(checkCodeMiddleware);

app.get("/admin", checkCodeMiddleware, (req, res) => {
  res.render("admin");
});

// 404 pages
app.use((req, res) => {
  res.status(404).render("404");
});

function recordMiddleware(req, res, next) {
  let { url, ip } = req;
  let dateTime = new Date().toISOString();
  fs.appendFileSync(
    path.resolve(__dirname, "./access.log"),
    `${dateTime} ${url} ${ip}\n`
  );
  next();
}

function checkCodeMiddleware(req, res, next) {
  if (req.query.code === "009") {
    next();
  } else {
    res.render("404");
  }
}
