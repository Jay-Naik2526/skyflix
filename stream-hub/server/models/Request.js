const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String },
  platform: { type: String }, // e.g., Netflix, Prime
  status: { type: String, default: "Pending", enum: ["Pending", "Completed"] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Request", RequestSchema);