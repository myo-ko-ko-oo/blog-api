import "dotenv/config";
import { app } from "./app";
import express, { Request, Response, NextFunction } from "express";

const PORT = process.env.PORT || 4000;
// const host = "0.0.0.0";

app.listen(Number(PORT), () => console.log(`Server is running at ${PORT}:`));
