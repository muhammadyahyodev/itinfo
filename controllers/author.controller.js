const Author = require("../models/Author");
const bcrypt = require("bcrypt");
const jwt = require("../services/JwtService");
const config = require("config");
const Joi = require("joi");
const mongoose = require("mongoose");
const ApiError = require("../error/ApiError");
const emailValidation = require("../helpers/emailValidation");

const addAuthor = async (req, res) => {
  try {
    const {
      author_first_name,
      author_last_name,
      author_nick_name,
      author_email,
      author_phone,
      author_password,
      author_info,
      author_position,
      author_photo,
      is_expert,
    } = req.body;
    const check2 = await Author.findOne({ author_nick_name });
    if (check2 != null)
      return res.error(400, { message: "Information has already been added" });
    const authorHashedPassword = bcrypt.hashSync(author_password, 7);
    const data = await Author({
      author_first_name,
      author_last_name,
      author_nick_name,
      author_email,
      author_phone,
      author_password: authorHashedPassword,
      author_info,
      author_position,
      author_photo,
      is_expert,
    });
    await data.save();
    res.ok(200, "OK. Author is added");
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const getAuthor = async (req, res) => {
  try {
    const id = req.params.id;
    let isValid = mongoose.Types.ObjectId.isValid(id);
    console.log(isValid);
    if (!isValid) return res.error(406, { message: "Id is Incorrect" });
    const data = await Author.findOne({ _id: id });
    if (data == null)
      return res.error(400, { friendlyMsg: "Id bo'yicha ma'lumot yo'q" });
    // res.send(data);
    res.send(data);
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const getAuthors = async (req, res) => {
  try {
    const info = await Author.find({});
    if (info.length < 1) res.error(400, { message: "Ma'lumot yo'q" });
    // res.ok(200,info);
    res.send(info);
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const id = req.params.id;
    let isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) return res.error(406, { message: "Id is Incorrect" });
    const result = await Author.findOne({ _id: id });
    if (result == null) return res.error(406, { message: "Id is Incorrect" });
    const {
      author_first_name,
      author_last_name,
      author_nick_name,
      author_email,
      author_phone,
      author_password,
      author_info,
      author_position,
      author_photo,
      is_expert,
    } = req.body;
    const authorHashedPassword = bcrypt.hashSync(author_password, 7);
    const data = await Author.findByIdAndUpdate(
      { _id: id },
      {
        author_first_name,
        author_last_name,
        author_nick_name,
        author_email,
        author_phone,
        author_password: authorHashedPassword,
        author_info,
        author_position,
        author_photo,
        is_expert,
      }
    );
    await data.save();
    res.ok(200, "AuthorInfo is updated");
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const id = req.params.id;
    let isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) return res.error(400, { message: "Id is Incorrect" });
    const result = await Author.findOne({ _id: id });
    if (result == null) return res.error(400, { message: "Id is incorrect" });
    await Author.findByIdAndDelete(id);
    res.ok(200, { message: "OK. Author is deleted" });
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const loginAuthor = async (req, res) => {
  let author;
  const { login, author_password } = req.body;
  const phoneRegExp = /\d{2}-\d{3}-\d{2}-\d{2}/.test(login);
  if (phoneRegExp) author = await Author.findOne({ author_phone: login });
  else if (emailValidation(login))
    author = await Author.findOne({ author_email: login });
  else author = await Author.findOne({ author_nick_name: login });
  if (!author) return res.error(400, { friendlyMsg: "Malumotlarr notogri" });
  const validPassword = bcrypt.compareSync(
    author_password,
    author.author_password
  );
  if (!validPassword)
    return res.error(400, { friendlyMsg: "Malumotlar notogri" });
  const payload = {
    id: author.id,
    author_is_expert: author.author_is_expert,
  };
  const tokens = jwt.generateTokens(payload);
  author.author_token = tokens.refreshToken;
  await author.save();
  res.cookie("refreshToken", tokens.refreshToken, {
    maxAge: config.get("refresh_ms"),
    httpOnly: true,
  });
  res.ok(200, tokens);
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    let author;
    if (!refreshToken)
      return res.error(400, { friendlyMsg: "Token is not found" });
    author = await Author.findOneAndUpdate(
      { author_token: refreshToken },
      { author_token: "" },
      { new: true }
    );
    if (!author) return res.error(400, { friendlyMsg: "Token topilmadi" });
    res.clearCookie("refreshToken");
    res.ok(200, author);
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};
const refreshAuthorToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken)
      return res.error(400, { friendlyMsg: "Token is not found" });
    const authorDataFromCookie = await jwt.verifyRefresh(refreshToken);
    const authorDataFromDb = await Author.findOne({
      Author_token: refreshToken,
    });
    if (!authorDataFromCookie || !authorDataFromDb) {
      return res.error(400, { friendlyMsg: "Author is not registered" });
    }
    const author = await Author.findById(authorDataFromCookie.id);
    if (!author) return res.error(400, { friendlyMsg: "ID is incorrect" });
    const payload = {
      id: author.id,
      author_is_expert: author.author_is_expert,
    };
    const tokens = jwt.generateTokens(payload);
    author.author_token = tokens.refreshToken;
    await author.save();
    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: config.get("refresh_ms"),
      httpOnly: true,
    });
    res.ok(200, tokens);
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};
module.exports = {
  getAuthor,
  getAuthors,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  loginAuthor,
  logout,
  refreshAuthorToken,
};
