# WanderLust

An Airbnb-style travel listings platform. Visitors can browse stays on a map, and logged-in users
can create, edit and delete their own listings (with photos) and leave star-rated reviews.

**Live demo:** _add your Render link here_

## Features

- Browse listings, each with a photo, price, owner and an interactive map (Mapbox)
- Sign up, log in and log out (passwords are hashed; sessions are stored in MongoDB)
- Create, edit and delete your own listings, with image upload to Cloudinary
- Location is converted to map coordinates automatically (Mapbox geocoding)
- Star ratings and comments; only the author can delete a review
- Only an owner can edit or delete a listing; server-side validation with Joi
- Flash messages, friendly error pages, and safe handling of wrong URLs and uploads

## Tech stack

Node.js, Express 5, EJS (ejs-mate), MongoDB Atlas with Mongoose, Passport (local strategy),
express-session with connect-mongo, Multer with Cloudinary, Mapbox, Joi, Bootstrap 5.

## Run it locally

1. Install Node.js 20.19 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in the values.
4. Optional sample data: `node init/index.js` (replaces all listings in that database)
5. `npm run dev`, then open http://localhost:8080

## Project structure

```
app.js            server setup, sessions, login, routes, error handling
routes/           URL routes (listings, reviews, users)
controllers/      what each route does
models/           MongoDB models (Listing, Review, User)
middleware.js     login, ownership and validation checks
schema.js         Joi validation rules
views/            EJS pages (layouts, includes, listings, users)
public/           CSS and browser JavaScript
init/             sample data
```
