// import AWS from "aws-sdk";

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// export default async function handler(req, res) {
//   if (req.method !== "GET") return res.status(405).end();

//   const { name, type } = req.query;
//   if (!name || !type) return res.status(400).json({ message: "name & type required" });

//   const key = `uploads/${Date.now()}-${name}`;
//   const params = {
//     Bucket: process.env.S3_BUCKET_NAME,
//     Key: key,
//     ContentType: type,
//     Expires: 60, // seconds
//   };

//   try {
//     const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
//     const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

//     res.json({ uploadUrl, key, publicUrl });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }
