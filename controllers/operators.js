const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');
const fs = require('fs');

exports.getAll = Model =>
  catcher(async (req, res, next) => {
    const datas = await Model.find();
    res.status(200).json({ status: 'success', data: datas });
  });

exports.getOne = Model =>
  catcher(async (req, res, next) => {
    const data = await Model.findById(req.params.id);
    if (!data)
      return next(new ErrorThrower('No document found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.createOne = (Model, path, file) =>
  catcher(async (req, res, next) => {
    const data = await Model.create(req.body);

    if (path && file) {
      data.image = `image-${data.id}.jpeg`;
      fs.renameSync(`${path}/${file}`, `${path}/${data.image}`);
      await data.save();
    }

    res.status(201).json({ status: 'success', data });
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
    res.status(200).json({
      status: 'success',
      data,
    });
  });

exports.deleteOne = (Model, path) =>
  catcher(async (req, res, next) => {
    const data = await Model.findByIdAndDelete(req.params.id);
    if (!data)
      return next(
        new ErrorThrower('No document found and cannot be deleted', 404)
      );
    if (path) fs.unlinkSync(`${path}/${data.image}`);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.deleteAll = Model =>
  catcher(async (req, res, next) => {
    const data = await Post.deleteMany();
    res.status(201).json({ status: 'success', data: null });
  });
