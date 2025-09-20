// import express from "express";
// import morgan from "morgan";
// import helmet from "helmet";
// import compression from "compression";
// import cors from "cors";

// import router from "./routes/v1";
// import { corsOptions } from "./utilities/cors";
// import { limiter } from "./middleware/limiter";
// import { serverError } from "./utilities/error";
// import cookieParser from "cookie-parser";
// import { strict } from "assert";
// export default const app = express();

// app

//   .use(express.urlencoded({ extended: true })) //to get from req body data easily eg.req.body.name ...
//   .use(morgan("dev")) // to get req,res LOG
//   .use(compression()) // to compress small files when req,res time quickly
//   .use(cors(corsOptions)) // to allow origin domain eg.[www.mysite.com/api,www.frontend.com]
//   .use(express.json())
//   .use(helmet()) //to manage header{security ,suh as token}
//   .use(limiter)
//   .use(cookieParser())
//   .use(serverError) //create server error 500
//   .use(router); //Router

import express from "express";
import router from "./routes/v1";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./utilities/cors";
import { limiter } from "./middleware/limiter";
import { serverError } from "./utilities/error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(limiter);
app.use(router);
app.use(serverError);

export default app;
