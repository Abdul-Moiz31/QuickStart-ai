const express = require("express");
const cors = require("cors");
const { connectDB } = require("./database/database");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require('compression');
const app = express();
const ErrorHandler = require("./middleware/error");


const PORT = process.env.PORT || 3100;
// require("dotenv").config();

require("dotenv").config({ path: "./config/.env" });

connectDB();

// In your backend app.js/server.js
app.use(cors({
  origin: ["http://localhost:3000","https://quick-start-ai-client.vercel.app/"],
  credentials: true
}));



app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

app.use(limiter);

const userRoutes = require("./routes/userRoutes");
const chatbotRoutes = require("./routes/chatbotRoute");
const sessionRoutes = require("./routes/sessionRoute");
const messageRoutes = require("./routes/messageRoute");

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/message", messageRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy!" });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Not found route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});


app.use(ErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
















// const express = require("express");
// const cors = require("cors");
// const { connectDB } = require("./database/database");
// const cookieParser = require("cookie-parser");
// const rateLimit = require("express-rate-limit");
// const morgan = require("morgan");
// const compression = require('compression');
// const spdy = require('spdy'); 
// const fs = require('fs');
// const path = require('path');
// const app = express();

// const PORT = 3000;

// require("dotenv").config({ path: "./config/.env" });

// connectDB();

// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     methods: ["POST", "GET", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

// app.use(morgan("dev"));
// app.use(compression());
// app.use(express.json({ limit: "150mb" }));
// app.use(express.urlencoded({ limit: "150mb", extended: true }));
// app.use(cookieParser());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   message: "Too many requests from this IP, please try again after 15 minutes.",
// });

// app.use(limiter);

// const userRoutes = require("./routes/userRoutes");
// const chatbotRoutes = require("./routes/chatbotRoute");
// const sessionRoutes = require("./routes/sessionRoute");
// const messageRoutes = require("./routes/messageRoute");

// app.use("/api/v1/user", userRoutes);
// app.use("/api/v1/chatbot", chatbotRoutes);
// app.use("/api/v1/session", sessionRoutes);
// app.use("/api/v1/message", messageRoutes);






// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok", message: "Server is healthy!" });
// });

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });


// // Not found route

// app.use((req, res, next) => {
//   res.status(404).json({
//     success: false,
//     message: "Page not found",
//   });
// });




// const options = {
//   key: fs.readFileSync(path.join(__dirname,  'server.key')),
//   cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
// };

// spdy.createServer(options, app).listen(PORT, (err) => {
//   if (err) {
//     console.error("Failed to start server:", err);
//     return process.exit(1);
//   }
//   console.log(`HTTP/2 server is running on port ${PORT}`);
// });
