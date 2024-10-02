const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');
const options = require('../utils/options');

exports.getAll = Model =>
  catcher(async (req, res, next) => {
    const datas = await Model.find();
    res.status(200).json({ status: 'success', data: datas });
  });

exports.getOne = (Model, pop) =>
  catcher(async (req, res, next) => {
    let data = await Model.findById(req.params.id).select(req.filtered);
    if (pop) data = await data.populate(pop);
    if (!data)
      return next(new ErrorThrower('No document found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.createOne = (Model, path, file, secModel) =>
  catcher(async (req, res, next) => {
    // 1. Create the document
    const data = await Model.create(req.body);

    // 2. Handle image renaming, if applicable
    if (path && file) {
      data.image = `image-${data.id}.jpeg`;
      fs.renameSync(`${path}/${file}`, `${path}/${data.image}`);
      await data.save({ validateBeforeSave: false });
    }

    // 3. Handle assigning the post to the user, if secModel is provided
    if (secModel) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();
        const user = await secModel.findById(req.user.id);
        if (!user) {
          await session.abortTransaction();
          return next(
            new ErrorThrower('Could not find user for provided id', 404)
          );
        }
        data.creator = user.id;
        await data.save({ session, validateBeforeSave: false });
        user.posts.push(data);
        await user.save({ session, validateBeforeSave: false });
        await session.commitTransaction();
      } catch (error) {
        console.error('Error during transaction:', error); // Log the error
        next(new ErrorThrower('Creating data failed, please try again.', 500));
      }
    }

    // 5. Return the created data
    req.newData = data;
    if (data.password) next();
    else res.status(201).json({ status: 'success', data });
  });

exports.updateOne = Model =>
  catcher(async (req, res, next) => {
    const data = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (Model.modelName === 'Post' && data && data.modified === false) {
      data.modified = true;
      await data.save();
    }

    if (!data)
      return next(
        new ErrorThrower('No document found and cannot be modified', 404)
      );
    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.deleteOne = (Model, path, secModel) =>
  catcher(async (req, res, next) => {
    const id = req.removeThisId ? req.removeThisId : req.params.id;
    const data = await Model.findById(id);
    if (secModel) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();
        const user = await secModel.findById(data.creator);
        if (!user) {
          await session.abortTransaction();
          return next(
            new ErrorThrower('Could not find user for provided id', 404)
          );
        }
        if (!user.posts.includes(id) && req.user.role !== 'admin')
          return next(new ErrorThrower('Not authorized', 403));

        user.posts.pull(data);
        await user.save({ session, validateBeforeSave: false });
        await data.deleteOne({ session, validateBeforeSave: false });
        await session.commitTransaction();
      } catch (err) {
        console.error(err);
        return next(
          new ErrorThrower('Something went wrong to delete from database.', 500)
        );
      }
    } else {
      await Model.findByIdAndDelete(id);
    }
    if (!data)
      return next(
        new ErrorThrower('No document found and cannot be deleted', 404)
      );
    if (path) fs.unlinkSync(`${path}/${data.image}`);
    res.status(204).json({
      status: 'success',
      message: 'data deleted successfully',
    });
  });

exports.deleteAll = (Model, folderPath) =>
  catcher(async (req, res, next) => {
    try {
      let query = {};
      if (req.removeThisId) query = { creator: req.removeThisId };

      // Step 1: Find all records (posts) based on the query
      const records = await Model.find(query);

      // Step 2: Delete associated image files
      for (const record of records) {
        const id = record._id.toString();
        const imagePath = path.join(folderPath, `image-${id}.jpeg`);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(imagePath))
          fs.unlink(imagePath, err => {
            if (err)
              console.error(`Failed to delete image file: ${imagePath}`, err);
          });
      }

      // Step 3: Delete the records from the database
      await Model.deleteMany(query);

      if (!req.removeThisId)
        res.status(201).json({
          status: 'success',
          message: 'All data were deleted with success!',
        });
      else next();
    } catch (error) {
      console.error('Error deleting records and files:', error);
      return next(
        new ErrorThrower('No document found and cannot be deleted', 404)
      );
    }
  });

exports.uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) cb(null, true);
    else cb(new ErrorThrower('Please upload only images.', 400));
  },
}).single('image');

exports.resizeImage = (path, isUser, resX = null, resY = null, quality = 100) =>
  catcher(async (req, res, next) => {
    if (!req.file) return next();

    // priorities: req.params.id --> req.user.image (for logged userd only!) --> options.newImage

    req.body.image = req.params.id
      ? `image-${req.params.id}.jpeg`
      : isUser
      ? req.user.image
      : options.newImage;

    await sharp(req.file.buffer, { failOnError: false })
      .resize(resX, resY)
      .toFormat('jpeg')
      .jpeg({ quality })
      .toFile(`${path}/${req.body.image}`);
    next();
  });

// Only for testing purposes
exports.middlewareTest = () =>
  catcher(async (req, res, next) => {
    res.status(200).json({ status: 'success' });
  });

// exports.deleteAllBackup = (Model, folderPath, creatorId = null) =>
//   catcher(async (req, res, next) => {
//     if (Model) await Model.deleteMany();

//     fs.readdir(folderPath, (err, files) => {
//       if (err) {
//         console.error(`Error reading folder: ${err}`);
//         return;
//       }
//       // Loop through the files and delete each one
//       files.forEach(file => {
//         const filePath = path.join(folderPath, file);
//         fs.unlink(filePath, err => {
//           if (err) {
//             console.error(`Error deleting file: ${filePath} - ${err}`);
//           } else {
//             console.log(`Deleted file: ${filePath}`);
//           }
//         });
//       });
//     });

//     res.status(201).json({
//       status: 'success',
//       message: 'All data were deleted with success!',
//     });
//   });
