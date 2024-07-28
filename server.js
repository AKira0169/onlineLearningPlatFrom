const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const port = process.env.PORT || 8000;
mongoose.connect(DB).then(() => {
  // eslint-disable-next-line no-console
  console.log("Database connected successfully");
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`App running on port ${port}`);
  });
});
