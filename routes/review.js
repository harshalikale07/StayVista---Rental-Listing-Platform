const express = require("express");
const router = express.Router({mergeParams: true});
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema,reviewSchema } = require("../schema.js");
const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const reviewControllers = require("../controllers/reviews.js");


const validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);
  if(error) {
    let msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, error);
  }else{
    next();
  }
};



//review
router.post("/",
   validateReview,
    wrapAsync( reviewControllers.createReview)
);

//delete review
router.delete(
  "/:reviewId",
  isLoggedIn,
  wrapAsync( reviewControllers.deleteReview)
);


module.exports = router;
