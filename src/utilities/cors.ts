const whitelist = [
  "http://127.20.10.3:3000",
  "http://localhost:3000",
  "http://192.168.100.62:3000",
  "https://diabetes-blog-demo.vercel.app",
];
export const corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void
  ) {
    // Allow requests with no origin ( like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
