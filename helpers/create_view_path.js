const path = require("path");

const createViewPath = (page) => {
  return path.resolve(__dirname, "../views", `${page}.hbs`);
}
const errorHandler = (res, error) => {
  console.log("Error in this file: ", __filename);
  return res.status(500).send("Error: " + error);
}
module.exports = {
  createViewPath,
  errorHandler,
};
