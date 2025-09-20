import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";

import router from "./routes/v1";
import { corsOptions } from "./utilities/cors";
import { limiter } from "./middleware/limiter";
import { serverError } from "./utilities/error";
import cookieParser from "cookie-parser";
import { strict } from "assert";
export const app = express();

app

  .use(express.urlencoded({ extended: true })) //to get from req body data easily eg.req.body.name ...
  .use(morgan("dev")) // to get req,res LOG
  .use(compression()) // to compress small files when req,res time quickly
  .use(cors(corsOptions)) // to allow origin domain eg.[www.mysite.com/api,www.frontend.com]
  .use(express.json())
  .use(helmet()) //to manage header{security ,suh as token}
  .use(limiter)
  .use(cookieParser())
  .use(serverError) //create server error 500
  .use(router); //Router
