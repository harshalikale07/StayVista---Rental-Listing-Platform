const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  comment: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

reviews: [
  {
    type: Schema.Types.ObjectId,
    ref: "Review"
  }
]

module.exports = mongoose.model("Review", reviewSchema);