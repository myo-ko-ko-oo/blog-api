import "dotenv/config";
import { app } from "./app";
const PORT = process.env.PORT || 4000;
// const host = "0.0.0.0";
app.listen(Number(PORT), () => console.log(`Blog API with Prisma + roles ->server is running at ${PORT}:`));
