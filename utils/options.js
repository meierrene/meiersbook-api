const thumbnailSettings = { size: 600, quality: 80 };
const newImage = 'newImage.jpeg';
const getBucket = Model => {
  const bucket = `${Model.modelName.toLowerCase()}-images${
    process.env.NODE_ENV !== 'production' ? '-dev' : ''
  }`;
  const bucketType = bucket.split('-')[0];
  return { bucket, bucketType };
};

module.exports = {
  thumbnailSettings,
  newImage,
  getBucket,
};
