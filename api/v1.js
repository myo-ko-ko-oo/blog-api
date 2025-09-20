import app from "../dist/app.js";
import serverless from "serverless-http";

export default serverless(app);
