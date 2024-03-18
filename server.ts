import { app } from "./app";
import connectDB from "./utils/db";
require("dotenv").config();

//create server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is connected with port ${port}`);
  connectDB();
});
