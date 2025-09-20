// import { createClient } from "@supabase/supabase-js";
// import { Redis } from "@upstash/redis";

// // Supabase admin client
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// // Redis client
// const redis = Redis.fromEnv();

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).end();

//   const { key, publicUrl, userId } = req.body;
//   if (!key || !publicUrl) {
//     return res.status(400).json({ message: "Missing key/publicUrl" });
//   }

//   try {
//     // Save to Supabase table `images`
//     const { data, error } = await supabase
//       .from("images")
//       .insert([{ key, url: publicUrl, user_id: userId }]);

//     if (error) throw error;

//     // Cache in Redis
//     await redis.set(`image:${key}`, JSON.stringify({ url: publicUrl }), { ex: 3600 });

//     res.json({ success: true, data });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }
