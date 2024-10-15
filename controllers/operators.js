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
    const bucket = `${Model.modelName.toLowerCase()}-images`;
    const newFileName = `${Model.modelName.toLowerCase()}-${data.id}.jpeg`;

    await renameBucketImage(bucket, data.image, newFileName);
    data.image = newFileName;
    data.thumbnail = `thumb-${newFileName}`;
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

    const bucket = `${Model.modelName.toLowerCase()}-images`;
    if (data.image) {
      const { error: imageError } = await supabase.storage
        .from(bucket)
        .remove([data.image, `thumb-${data.image}`]);
      if (imageError)
        return next(new ErrorThrower('Failed to delete image files', 500));
    }

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
      const filesToDelete = [];
      const bucketType = Model.modelName.toLowerCase();

      for (const record of records) {
        const id = record._id.toString();
        const originalFilePath = `${bucketType}-${id}.jpeg`;
        const thumbnailFilePath = `thumb-${bucketType}-${id}.jpeg`;

        // Add each file path individually to the list
        filesToDelete.push(originalFilePath, thumbnailFilePath);
      }

      const bucket = `${bucketType}-images`;

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

      if (!req.removeThisId)
        res.status(201).json({
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

exports.resizeImage = (bucketType, resX = null, resY = null, quality = 100) =>
  catcher(async (req, res, next) => {
    if (!req.file) return next();

    const bucket = `${bucketType}-images`;
    const fileName = req.params.id
      ? `${bucketType}-${req.params.id}.jpeg`
      : !!req.user?.image
      ? req.user.image
      : options.newImage;

    const buffer = await sharp(req.file.buffer)
      .rotate()
      .resize(resX, resY)
      .toFormat('jpeg')
      .jpeg({ quality })
      .toBuffer();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, { cacheControl: '3600', upsert: true });

    if (error) return next(new ErrorThrower('Image upload failed', 500));

    req.body.image = data.path;

    // Generate and upload the thumbnail (300px width)
    const thumbnailBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize(options.thumbnailSettings.size)
      .jpeg({ quality: options.thumbnailSettings.quality })
      .toBuffer();

    const thumbnailName = `thumb-${fileName}`;
    const { error: thumbError } = await supabase.storage
      .from(bucket)
      .upload(thumbnailName, thumbnailBuffer, {
        cacheControl: '3600',
        upsert: true,
      });

    if (thumbError)
      return next(new ErrorThrower('Thumbnail upload failed', 500));

    req.body.thumbnail = thumbnailName;

    next();
  });

const renameBucketImage = async (bucket, oldFileName, newFileName) => {
  try {
    // 1. Download the image
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(oldFileName);

    if (downloadError)
      throw new Error(`Failed to download the image: ${downloadError.message}`);

    // 2. Upload the image with the new name
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newFileName, downloadData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload the image with a new name: ${uploadError.message}`
      );
    }

    // 3. Delete the old image
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([oldFileName]);

    if (deleteError) {
      throw new Error(`Failed to delete the old image: ${deleteError.message}`);
    }

    // Handle renaming the thumbnail as well
    const oldThumb = `thumb-${oldFileName}`;
    const newThumb = `thumb-${newFileName}`;

    const { data: thumbData, error: thumbError } = await supabase.storage
      .from(bucket)
      .download(oldThumb);

    if (!thumbError) {
      await supabase.storage
        .from(bucket)
        .upload(newThumb, thumbData, { cacheControl: '3600', upsert: false });

      await supabase.storage.from(bucket).remove([oldThumb]);
    }

    return newFileName;
  } catch (err) {
    throw new Error(`Failed to rename image: ${err.message}`);
  }
};
