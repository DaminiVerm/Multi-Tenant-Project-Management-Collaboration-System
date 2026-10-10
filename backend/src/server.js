require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Membership = require("./models/Membership");
const Project = require("./models/Project");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" } });
app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("_id");
    if (!user) return next(new Error("Unauthorized"));
    socket.user = user;
    next();
  } catch { next(new Error("Invalid socket token")); }
});
io.on("connection", socket => {
  socket.join(`user:${socket.user._id}`);
  socket.on("project:join", async ({ projectId }) => {
    try {
      const project = await Project.findById(projectId).select("organizationId");
      if (!project) return;
      const membership = await Membership.findOne({ organizationId: project.organizationId, userId: socket.user._id });
      if (membership) socket.join(`project:${projectId}`);
    } catch { /* Ignore invalid room requests */ }
  });
});
async function start() {
  await connectDB();
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`API listening on port ${port}`));
}
start().catch(err => { console.error("Server startup failed:", err.message); process.exit(1); });
