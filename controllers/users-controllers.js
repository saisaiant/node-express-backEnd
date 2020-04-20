const HttpError = require("../models/http-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError("Fetching User Failed, Try again later", 500);
    return next(err);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Sign Up Failed Please try again later", 500);
    return next(err);
  }

  if (existingUser) {
    const errs = new HttpError("User exits already, Please login instead", 422);
    return next(errs);
  }

  // const hasUser = DUMMY_USERS.find((u) => u.email === email);
  // if (hasUser) {
  //   throw new HttpError("Could not create user, email already exits", 422);
  // }
  let hashPassword;
  try {
    hashPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new HttpError("Could not create user, please try again", 500);
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashPassword,
    places: [],
  });
  // DUMMY_USERS.push(createUser);
  try {
    await createdUser.save();
  } catch (error) {
    let errs = new HttpError("Sign up failed, please try again", 500);
    return next(errs);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    let errs = new HttpError("Sign up failed, please try again", 500);
    return next(errs);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Log in Failed Please try again later", 500);
    return next(err);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials, Could not login", 403);
    return next(error);
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials, Could not login", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    let errs = new HttpError("Logging in failed, please try again", 500);
    return next(errs);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
  // const idendifiedUser = DUMMY_USERS.find((u) => u.email === email);
  // if (!idendifiedUser || idendifiedUser.password !== password) {
  //   throw new HttpError(
  //     "Could not identify user, credentials seem to be wrong",
  //     401
  //   );
  // }
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
