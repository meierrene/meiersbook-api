const thumbnailSettings = { size: 600, quality: 70 };
const newImage = 'newImage.jpeg';
const getThumbnailName = imageName => `thumb-${imageName}`;
const getBucket = (Model, id = null) => {
  const bucketType = Model.modelName.toLowerCase();
  const bucket = `${bucketType}-images${
    process.env.NODE_ENV !== 'production' ? '-dev' : ''
  }`;
  const imageName = `${bucketType}-${id || 'temp'}.jpeg`;

  return { bucket, bucketType, imageName };
};

module.exports = {
  thumbnailSettings,
  newImage,
  getThumbnailName,
  getBucket,
};
