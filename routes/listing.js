const express = require("express");
const router = express.Router();

const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner } = require("../middleware.js");

const listingController = require("../controllers/listing.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// validation — only validates if req.body.listing exists
const validateListing = (req, res, next) => {
  console.log("VALIDATE body:", JSON.stringify(req.body));
  console.log("VALIDATE file:", req.file ? req.file.originalname : "none");

  if (!req.body || !req.body.listing) {
    throw new ExpressError(400, "Invalid listing data");
  }

  let { error } = listingSchema.validate(req.body);
  if (error) {
    let msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

// INDEX
router.get("/", wrapAsync(listingController.index));

// NEW
router.get("/new", isLoggedIn, listingController.renderNewForm);

// CREATE
router.post(
  "/",
  isLoggedIn,
  upload.single("image"),
  validateListing,
  wrapAsync(listingController.createListing)
);

// SHOW
router.get("/:id", wrapAsync(listingController.showListing
));

// EDIT
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// UPDATE
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  validateListing,
  wrapAsync(listingController.updateListing)
);

// DELETE
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;
