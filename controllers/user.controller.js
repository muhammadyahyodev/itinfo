const User = require("../models/User");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("../services/JwtService");
const config = require("config");
const emailValidation = require("../helpers/emailValidation");
const ApiError = require("../error/ApiError");
const uuid = require("uuid");
const mailService = require("../services/MailService");
const { errorHandler } = require("../helpers/create_view_path");

const addUser = async (req, res) => {
  try {
    const { user_name, user_email, user_password, user_info, user_photo } =
      req.body;

    const userHashedPassword = bcrypt.hashSync(user_password, 7);
    const user_activation_link = uuid.v4();

    const user = await User({
      user_name,
      user_email,
      user_password: userHashedPassword,
      user_info,
      user_photo,
      user_activation_link,
    });

    await user.save();
    await mailService.sendActivationMail(
      user_email,
      `${config.get("api_url")}/api/user/activate/${user_activation_link}`
    );

    const payload = {
      id: user._id,
      user_activation_link: user.user_is_activate,
    };

    const tokens = jwt.generateTokens(payload);

    user.user_token = tokens.refreshToken;
    await user.save();

    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: config.get("refresh_ms"),
      httpOnly: true,
    });

    res.ok(200, { ...tokens, user: payload });
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "",
    });
  }
};

const userActivate = async (req, res) => {
  try {
    const user = await User.findOne({ user_activation_link: req.params.link });

    if (!user) {
      return res.error(400, { friendlyMsg: "User topilmadi!" });
    }

    if (user.user_is_active) {
      return res.error(400, { friendlyMsg: "User already activated!" });
    }

    user.user_is_active = true;
    await user.save();
    res.ok(200, "User activated!");
  } catch (error) {
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "",
    });
  }
};

// const restorePassword = async (req, res) => {
//   try {
//     const user = await User.findOne({ user_email: req.body.user_email });
//     if (!user) {
//       return res.status(400, { friendlyMsg: "No user with this email!" });
//     }

//     const newPassword = generator.generate({
//       length: 10,
//       numbers: true,
//       uppercase: false,
//     });

//     const userHashedPassword = bcrypt.hashSync(newPassword, 7);
//     user.user_password = userHashedPassword,

//     await updateUser.save();
//     res.ok(200, "Password updated and send to gmail!");
//   } catch (error) {
//     errorHandler(res, error);
//   }
// };

const getUsers = async (req, res) => {
  try {
    const data = await User.find({});
    if (!data.length)
      return res.error(400, { friendlyMsg: "Information not found" });
    res.send(data);
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const idData = await User.findById(id);
    if (!idData)
      return res.error(400, { friendlyMsg: "Information is not found" });
    res.ok(200, idData);
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const idData = await User.findById(id);
    if (!idData)
      return res.error(400, { friendlyMsg: "Information was not found" });
    const {
      user_name,
      user_email,
      user_password,
      user_info,
      user_photo,
      user_reg_date,
    } = req.body;
    const userHashedPassword = bcrypt.hashSync(user_password, 7);
    const data = await User.findByIdAndUpdate(
      { _id: id },
      {
        user_name,
        user_email,
        user_password: userHashedPassword,
        user_info,
        user_photo,
        user_reg_date,
      }
    );
    await data.save();
    res.ok(200, "OK.Info was updated");
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const idData = await User.findById(id);
    if (req.user.id !== req.params.id) {
      return res
        .status(403)
        .send({ message: "Xato! User faqat o'zini o'chira oladi" });
    }
    if (!idData)
      return res.error(400, { friendlyMsg: "Information was not found" });
    await User.findByIdAndDelete(id);
    res.ok(200, { friendlyMsg: "Ok. userInfo is deleted" });
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    let user;
    const { login, user_password } = req.body;
    if (emailValidation(login))
      user = await User.findOne({ user_email: login });
    else user = await User.findOne({ user_name: login });
    if (!user) return res.error(400, { friendlyMsg: "Malumotlar notogri" });

    const validPassword = bcrypt.compareSync(user_password, user.user_password);
    if (!validPassword)
      return res.error(400, { friendlyMsg: "Malumotlarr notogri" });
    const payload = {
      id: user.id,
    };
    const tokens = jwt.generateTokens(payload);
    user.user_token = tokens.refreshToken;
    await user.save();
    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: config.get("refresh_ms"),
      httpOnly: true,
    });
    res.ok(200, tokens);
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    let user;
    if (!refreshToken)
      return res.error(400, { friendlyMsg: "Token is not found" });
    user = await User.findOneAndUpdate(
      { user_token: refreshToken },
      { user_token: "" },
      { new: true }
    );
    if (!user) return res.error(400, { friendlyMsg: "Token topilmadi" });
    res.clearCookie("refreshToken");
    res.ok(200, user);
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};

const refreshUserToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken)
      return res.error(400, { friendlyMsg: "Token is not found" });

    const all = await User.find();
    console.log(all);
    const adminDataFromCookie = await jwt.verifyRefresh(refreshToken);

    console.log(adminDataFromCookie);

    const adminDataFromDb = await User.findOne({ admin_token: refreshToken });
    if (!adminDataFromCookie || !adminDataFromDb) {
      return res.error(400, { friendlyMsg: "Admin is not registered" });
    }
    const user = await User.findById(adminDataFromCookie.id);
    if (!user) return res.error(400, { friendlyMsg: "ID is incorrect" });
    const payload = {
      id: user.id,
    };
    const tokens = jwt.generateTokens(payload);
    user.user_token = tokens.refreshToken;
    await user.save();
    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: config.get("refresh_ms"),
      httpOnly: true,
    });
    res.ok(200, tokens);
  } catch (error) {
    console.error({ error: __filename });
    ApiError.internal(res, {
      message: error,
      friendlyMsg: "Serverda hatolik",
    });
  }
};
module.exports = {
  getUser,
  getUsers,
  addUser,
  userActivate,
  // restorePassword,
  updateUser,
  deleteUser,
  loginUser,
  logout,
  refreshUserToken,
};
