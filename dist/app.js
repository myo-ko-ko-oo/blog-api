import express from "express";
export const app = express();
//Error throw
app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || "Server Error";
    const errorCode = error.code || "Error_Code";
    res.status(status).json({ message, error: errorCode });
});
