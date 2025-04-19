const express = require("express");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const { registerSchema } = require("./utils/validatorSchema");
const logger = require("./utils/logger");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);


const users = [];

app.post("/register", async (req, res) => {
  const { value, error } = registerSchema.validate(req.body);
  if (error) {
    logger.warn("Validation error", { error: error.details[0].message });
    return res.status(400).json({ message: error.details[0].message });
  }
  const { name, email, password } = value;


  const existing = users.find((u) => u.email === email);
  if (existing) {
    logger.warn("Duplicate email attempt", { email });
    return res.status(409).json({ message: "User already exists." });
  }

  const hashed = await bcrypt.hash(password, 12);
  users.push({ name, email, password: hashed });
  logger.info("User registered", { email });
  res.status(201).json({ message: "Registered successfully." });
});

app.get("/health", (req, res) => {
  res.send("Backend healthy");
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} initiated at ${new Date().toISOString()}`);
});
