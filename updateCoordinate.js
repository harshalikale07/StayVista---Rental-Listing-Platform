if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing = require("./models/listing");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocodingClient = mbxGeocoding({
  accessToken: process.env.MAP_TOKEN,
});

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function updateDB() {
  await mongoose.connect(MONGO_URL);
  console.log("DB connected");

  let listings = await Listing.find({});

  for (let listing of listings) {
    try {
      let response = await geocodingClient.forwardGeocode({
        query: listing.location,
        limit: 1,
      }).send();

      if (response.body.features.length > 0) {
        listing.geometry = response.body.features[0].geometry;
        await listing.save();
        console.log(`Updated: ${listing.title}`);
      } else {
        console.log(`No location found: ${listing.title}`);
      }
    } catch (err) {
      console.log(`Error for ${listing.title}`);
    }
  }

  mongoose.connection.close();
}

updateDB();