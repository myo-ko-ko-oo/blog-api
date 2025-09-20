Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router_1 = require("./routes/v1");
const morgan_1 = require("morgan");
const helmet_1 = require("helmet");
const compression_1 = require("compression");
const cors_1 = require("cors");
const cookie_parser_1 = require("cookie-parser");
const cors_2 = require("./utilities/cors");
const limiter_1 = require("./middleware/limiter");
const error_1 = require("./utilities/error");

const app = (0, express_1.default)();

app.use((0, express_1.json)());
app.use((0, express_1.urlencoded)({ extended: true }));
app.use((0, morgan_1.default)("dev"));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)(cors_2.corsOptions));
app.use((0, cookie_parser_1.default)());
app.use(limiter_1.limiter);

app.use(router_1.default);

app.use(error_1.serverError); // error handler

exports.default = app; // ✅ default export
