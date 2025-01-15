const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');
const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');
const supabase = require('../utils/supabase.js');
const options = require('../utils/options.js');

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

exports.createOne = (Model, secModel) =>
  catcher(async (req, res, next) => {
    // 1. Create the document
    const data = await Model.create(req.body);

    data.image = await renameBucketImage(Model, data.image, data.id);
    if (Model.modelName === 'Post')
      data.thumbnail = options.getThumbnailName(data.image);
    await data.save({ validateBeforeSave: false });

    if (req.body.imageUrl) {
      data.image = req.body.imageUrl;
      await data.save({ validateBeforeSave: false });
    }

    if (secModel) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();
        const user = await secModel.findById(req.user.id).session(session);
        if (!user) {
          await session.abortTransaction();
          return next(
            new ErrorThrower('Could not find user for provided id', 404)
          );
        }
        data.creator = user._id;
        await data.save({ session, validateBeforeSave: false });
        user.posts.push(data._id);
        await user.save({ session, validateBeforeSave: false });
        await session.commitTransaction();
      } catch (error) {
        next(new ErrorThrower('Creating data failed, please try again.', 500));
      }
    }

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

    if (!data)
      return next(
        new ErrorThrower('No document found and cannot be modified', 404)
      );

    if (Model.modelName === 'Post' && data && data.modified === false) {
      data.modified = true;
      await data.save();
    }

    data.image = await renameBucketImage(Model, data.image, data.id);
    if (Model.modelName === 'Post')
      data.thumbnail = options.getThumbnailName(data.image);
    await data.save({ validateBeforeSave: false });

    if (req.body.imageUrl) {
      data.image = req.body.imageUrl;
      await data.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.deleteOne = (Model, secModel) =>
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

    const { bucket } = options.getBucket(Model);

    if (data.image) {
      const { error: imageError } = await supabase.storage
        .from(bucket)
        .remove([data.image, options.getThumbnailName(data.image)]);
      if (imageError)
        return next(new ErrorThrower('Failed to delete image files', 500));
    }

    res.status(204).json({
      status: 'success',
      message: 'data deleted successfully',
    });
  });

exports.deleteAll = (Model, secModel) =>
  catcher(async (req, res, next) => {
    try {
      let query = {};
      if (req.removeThisId && req.removeThisId !== 'delete-everything')
        query = { creator: req.removeThisId };

      if (req.removeThisId === 'delete-everything') query = {}; // No filter, delete all records

      // Step 1: Find all records (posts) based on the query
      const records = await Model.find(query);

      // Step 2: Delete associated image files
      const filesToDelete = [];

      const { bucket } = options.getBucket(Model);

      for (const record of records) {
        const id = record._id.toString();
        const { imageName } = options.getBucket(Model, id);
        const originalFilePath = imageName;
        const thumbnailFilePath = options.getThumbnailName(imageName);

        // Add each file path individually to the list
        filesToDelete.push(originalFilePath, thumbnailFilePath);
      }

      if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete);

        if (error)
          return next(
            new ErrorThrower('Error deleting files from storage', 500)
          );
      }

      // Step 3: Delete the records from the database
      await Model.deleteMany(query);
      // Step 4: Clear the 'posts' field for every user
      if (secModel && req.removeThisId === 'delete-everything')
        await secModel.updateMany({}, { posts: [] });

      if (req.removeThisId === 'delete-everything')
        res.status(204).json({
          status: 'success',
          message: 'All data were deleted with success!',
        });
      else next();
    } catch (error) {
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

exports.resizeImage = (Model, resX = null, resY = null, quality = 100) =>
  catcher(async (req, res, next) => {
    if (!req.file) return next();

    // const idLogic =
    //   Model.modelName === 'Post' ? req.params.id || null : req.user.id;

    const { bucket } = options.getBucket(Model);
    const imageName = options.newImage;

    const buffer = await sharp(req.file.buffer)
      .rotate()
      .resize(resX, resY)
      .toFormat('jpeg')
      .jpeg({ quality })
      .toBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(imageName, buffer, { cacheControl: '3600', upsert: true });

    if (error) {
      return next(new ErrorThrower('Image upload failed', 500));
    }

    req.body.image = imageName;

    if (Model.modelName === 'Post') {
      const thumbnailName = options.getThumbnailName(imageName);

      const thumbnailBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize(options.thumbnailSettings.size)
        .jpeg({ quality: options.thumbnailSettings.quality })
        .toBuffer();

      const { error: thumbError } = await supabase.storage
        .from(bucket)
        .upload(thumbnailName, thumbnailBuffer, {
          cacheControl: '1',
          upsert: true,
        });

      if (thumbError)
        return next(new ErrorThrower('Thumbnail upload failed', 500));

      req.body.thumbnail = thumbnailName;
    }

    next();
  });

const renameBucketImage = async (Model, oldImageName, id) => {
  const { bucket, imageName } = options.getBucket(Model, id);

  // Skip renaming if the file already has the correct name
  if (oldImageName === imageName) {
    return imageName;
  }

  try {
    // //Delete the doubled names to ensure the file will be renamed
    await supabase.storage.from(bucket).remove(imageName);

    // Download the old file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(oldImageName);

    if (downloadError)
      throw new Error(`Failed to download the image: ${downloadError.message}`);

    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(imageName, fileData, {
        cacheControl: '1',
        upsert: false,
      });

    if (uploadError)
      throw new Error(
        `Failed to upload the image with a new name: ${uploadError.message}`
      );

    // Remove the old file
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([oldImageName]);

    if (deleteError)
      throw new Error(`Failed to delete the old image: ${deleteError.message}`);

    if (Model.modelName === 'Post') {
      // Handle renaming the thumbnail as well
      const newThumbnail = options.getThumbnailName(imageName);
      const oldThumbnail = options.getThumbnailName(oldImageName);

      await supabase.storage.from(bucket).remove(newThumbnail);

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(bucket)
        .download(oldThumbnail);

      if (!thumbError) {
        await supabase.storage.from(bucket).upload(newThumbnail, thumbData, {
          cacheControl: '3600',
          upsert: false,
        });

        await supabase.storage.from(bucket).remove([oldThumbnail]);
      }
    }

    return imageName;
  } catch (err) {
    throw new Error(`Failed to rename image: ${err.message}`);
  }
};
