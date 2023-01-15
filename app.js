const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const config = require("config");
const mongoose = require("mongoose");
const routes = require("./routes/index.routes");
const PORT = config.get("port") || 3030;
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const {
  expressWinstonLogger,
  expressWinstonErrorLogger,
} = require("./middleware/loggerMiddleware");
const logger = require("./services/logger");
const exHb = require("express-handlebars");
const frontRoutes = require("./routes/front.routes");
// const winston = require("winston");
// require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

// ------------- dotenv -----------------
// console.log(process.env.NODE_ENV);
// console.log(process.env.prod_smtp_password);

// ------------- config -----------------
// console.log(config.get("access_key"));
// console.log(config.get("refresh_key"));

// ----------- TEST -------------
// logger.log("info", "log data");
// logger.debug("debug data");
// logger.error("error data");
// logger.warn("warn data");
// logger.info("info data");

// Nazarda tutilmagan hatoliklarni tutib olib dasturni ishlashini to'xtadi...
// process.on("uncaughtException", (ex) => {
//   console.log("uncaughtException", ex.message);
//   process.exit(1);
// });
// process.on("unhandledRejection", (ex) => {
//   console.log("unhandledRejection", ex.message);
//   process.exit(1);
// });

const app = express();
app.use(express.json()); // frontend'dan kelayotgan json so'rovlarni json ko'rinishiga o'tkazib beradi va tanidi...

app.use(cookieParser()); // frontend'dan kelayotgan cookie so'rovlarni tanib olishi uchun foydalanamiz...
app.use(cors()); // frontend tomon bilan ma'lumot almashish uchun kerak u siz frontend serverga so'rov jo'natolmaydi!

const hbs = exHb.create({
  defaultLayout: "main",
  extname: "hbs", // hadblebars
});

hbs.handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

app.use(express.static("image"));

app.engine("hbs", hbs.engine);

app.set("view engine", "hbs");
app.set("views", "views");
app.use(express.static("views"));

app.use(expressWinstonLogger);
app.use(frontRoutes);
app.use(routes);
app.use(expressWinstonErrorLogger);

app.use(errorHandler); // Kelayotgan xatoliklarni tutadi
async function start() {
  try {
    await mongoose.connect(config.get("dbUri")); // mongodb bilan bog'lanish
    app.listen(PORT, () => {
      console.log(`Server has been started in ${PORT} port...`);
    });
  } catch (error) {
    logger.error(error.message);
  }
}
start();
