const jwt = require("jsonwebtoken");

const User = require("../models/usersModel");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  const token = signToken(user._id);
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({ status: "success", token, date: { user } });
};

exports.signUp = async (req, res, next) => {
  console.log(req.body);
  try {
    const user = await User.create({
      userName: req.body.userName,
      fristName: req.body.fristName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    createSendToken(user, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.correctpassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err,
    });
  }
};
exports.protect = async (req, res, next) => {
  try {
    //step one get the token check if it there
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to get access",
      });
    }
    //verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // check if the user is still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token does no longer exist",
      });
    }
    //check if the user changed password after the token was issued

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err,
    });
  }
};
