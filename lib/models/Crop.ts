import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerQuintal: { type: Number, required: true },
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Crop || mongoose.model("Crop", cropSchema, "crops");
