const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ── helper: geocode a location string and return GeoJSON geometry ──
async function geocode(location, country) {
  const query = `${location}, ${country}`;
  const response = await geocodingClient
    .forwardGeocode({ query, limit: 1 })
    .send();

  if (
    !response.body.features ||
    response.body.features.length === 0
  ) {
    return { type: "Point", coordinates: [0, 0] };
  }

  return response.body.features[0].geometry; // { type: "Point", coordinates: [lng, lat] }
}

// ── INDEX ──────────────────────────────────────────────────────────
module.exports.index = async (req, res) => {
  let { search } = req.query;
  let allListings;

  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i");
    allListings = await Listing.find({
      $or: [
        { title: regex },
        { location: regex },
        { country: regex }
      ]
    });
  } else {
    search = "";
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings, search });
};



// ── NEW FORM ───────────────────────────────────────────────────────
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ── SHOW ───────────────────────────────────────────────────────────
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    });

  if (!listing) {
    req.flash("error", "Listing Not Found!");
    return res.redirect("/listings");
  }

  // ⭐ Calculate average rating
  let avgRating = 0;

  if (listing.reviews.length > 0) {
    let total = listing.reviews.reduce((sum, review) => {
      return sum + review.rating;
    }, 0);

    avgRating = total / listing.reviews.length;
  }
  res.render("listings/show.ejs", {
    listing,
    currentUser: req.user,
    mapToken: process.env.MAP_TOKEN,
    avgRating
  });
};

// ── CREATE ─────────────────────────────────────────────────────────
module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  // image
  if (req.file) {
    newListing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }

  // geocode location → store coordinates
  newListing.geometry = await geocode(
    req.body.listing.location,
    req.body.listing.country
  );

  await newListing.save();
  req.flash("success", "Successfully made a new listing");
  res.redirect("/listings");
};

// ── EDIT FORM ──────────────────────────────────────────────────────
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing Not Found!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

// ── UPDATE ─────────────────────────────────────────────────────────
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );

  // update image if new file uploaded
  if (req.file) {
    listing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }

  // re-geocode in case location/country changed
  listing.geometry = await geocode(
    req.body.listing.location,
    req.body.listing.country
  );

  await listing.save();
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

// ── DELETE ─────────────────────────────────────────────────────────
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully!");
  res.redirect("/listings");
};
