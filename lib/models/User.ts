import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    language: { type: String, default: "en", enum: ["en", "hi"] },
    city: { type: String, default: "" },
    state: { type: String, default: "Madhya Pradesh" },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema, "users");
