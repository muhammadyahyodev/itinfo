const Author = require("../models/Author");
const Dictionary = require("../models/Dictionary");
const Topic = require("../models/Topic");
const { Router } = require("express");

const router = Router();
const { createViewPath } = require("../helpers/create_view_path");

router.get("/", async (req, res) => {
  res.render(createViewPath("index"), {
    title: "Home",
    page_name: "index",
  });
});

router.get("/dictionary", async (req, res) => {
  const dictionary = await Dictionary.find().lean();
  res.render(createViewPath("dictionary"), {
    title: "Dictionary page",
    page_name: "dictionary",
    dictionary,
  });
});

router.get("/authors", async (req, res) => {
  const author = await Author.find().lean();
  res.render(createViewPath("authors"), {
    title: "Authors page",
    page_name: "authors",
    author,
  });
});

router.get("/topics", async (req, res) => {
  const topics = await Topic.find().lean();
  res.render(createViewPath("topics"), {
    title: "Topics page",
    page_name: "topics",
    topics,
  });
});

module.exports = router;
