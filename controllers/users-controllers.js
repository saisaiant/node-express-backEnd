const HttpError = require("../models/http-error");
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
  const createdUser = new User({
    name,
    email,
    image:
      "https://webheads-g9n1f8q3p5.netdna-ssl.com/wp-content/uploads/2018/04/newyor-api.jpg",
    password,
    places: [],
  });
  // DUMMY_USERS.push(createUser);
  try {
    await createdUser.save();
  } catch (error) {
    let errs = new HttpError("Sign up failed, please try again", 500);
    return next(errs);
  }
  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
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
  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError("Invalid credentials, Could not login", 401);
    return next(error);
  }

  res.json({ message: "Logged in" , user: existingUser.toObject({getters:true})});
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
