const Listing = require("../models/listing");
const Review = require("../models/reviews");

module.exports.createReview = async (req, res) => {
 let listing = await Listing.findById(req.params.id);
 let review = new Review(req.body.review);
     review.author = req.user._id;
     listing.reviews.push(review);
        await review.save();
        await listing.save();
    req.flash("success", "Review Added Successfully!");
       console.log(review);
    res.redirect(`/listings/${listing._id}`)
       console.log(req.body.review);
};




module.exports.deleteReview = async (req, res) => {
   let { id, reviewId } = req.params;
   await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId }
    });
    await Review.findByIdAndDelete(reviewId);
       req.flash("success", "Review deleted successfully!");
       res.redirect(`/listings/${id}`);
  };