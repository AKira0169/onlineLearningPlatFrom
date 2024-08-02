exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    console.log(roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
