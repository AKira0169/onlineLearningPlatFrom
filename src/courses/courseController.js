const Course = require("./courseModel");
const expressAsyncHandler = require("express-async-handler");
const AppError = require("../../utils/appError");
const cloudinary = require("cloudinary").v2;

const generateSignedUrl = (publicId) => {
  const options = {
    resource_type: "video",
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // URL expires in 1 hour
  };
  return cloudinary.url(publicId, options);
};

exports.getAllCourses = expressAsyncHandler(async (req, res, next) => {
  const courses = await Course.find();
  if (!courses || courses.length === 0) {
    return next(new AppError("No courses found", 404));
  }
  res.status(200).json({
    status: "success",
    results: courses.length,
    data: {
      courses,
    },
  });
});

exports.uploadVideo = expressAsyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No video uploaded", 400));
  }
  res.status(200).json({
    status: "success",
    message: "Video uploaded successfully!",
    videoUrl: req.file.path,
  });
});

exports.initCourse = expressAsyncHandler(async (req, res, next) => {
  const { title, description, instructor, duration, level, modules } = req.body;
  const newCourse = new Course({
    title,
    description,
    instructor,
    duration,
    level,
    modules,
  });
  const savedCourse = await newCourse.save();
  res.status(201).json(savedCourse);
});

exports.createModuleForCourse = expressAsyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { title, order, lessons } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }
  course.modules.push({ title, order, lessons });
  const updatedCourse = await course.save();
  res.status(201).json(updatedCourse);
});

exports.createLesson = expressAsyncHandler(async (req, res, next) => {
  const { courseId, moduleId } = req.params;
  const { title, duration, order } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }
  const module = course.modules.id(moduleId);
  if (!module) {
    return next(new AppError("Module not found", 404));
  }
  if (!req.file) {
    return next(new AppError("No video uploaded", 400));
  }

  const publicId = req.file.filename; // Cloudinary public ID
  module.lessons.push({ title, duration, videoUrl: publicId, order });
  const updatedCourse = await course.save();
  res.status(201).json(updatedCourse);
});

exports.getLesson = expressAsyncHandler(async (req, res, next) => {
  const { courseId, moduleId, lessonId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError("Course not found", 404));
  }
  const module = course.modules.id(moduleId);
  if (!module) {
    return next(new AppError("Module not found", 404));
  }
  const lesson = module.lessons.id(lessonId);
  if (!lesson) {
    return next(new AppError("Lesson not found", 404));
  }

  // Ensure user is subscribed to the course
  // if (!req.user.subscribedCourses.includes(courseId)) {
  //   return next(new AppError("You are not subscribed to this course", 403));
  // }

  const signedUrl = generateSignedUrl(lesson.videoUrl);
  res.status(200).json({
    ...lesson.toObject(),
    signedUrl,
  });
});

exports.updateCourse = expressAsyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const updates = req.body;
  const updatedCourse = await Course.findByIdAndUpdate(courseId, updates, {
    new: true,
  });
  if (!updatedCourse) {
    return next(new AppError("Course not found", 404));
  }
  res.status(200).json(updatedCourse);
});

exports.deleteCourse = expressAsyncHandler(async (req, res, next) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    return next(
      new AppError(`Course not found with id: ${req.params.id}`, 404)
    );
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
