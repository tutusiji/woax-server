const mongoose = require("mongoose");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    email: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
  },
  { collection: "admins" }
);

// 密码加密方法
adminSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
};

// 验证密码方法
adminSchema.methods.validatePassword = function(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
  return this.passwordHash === hash;
};

module.exports = mongoose.model("Admin", adminSchema);