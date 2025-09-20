import { app } from "../dist/index.js";
import serverless from "serverless-http";

export default serverless(app);
