import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
    crop: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true }, // The market average price
    mandi: { type: String, required: true },
    state: { type: String, required: true }
});

// Compound index for efficient lookup
priceSchema.index({ crop: 1, date: 1 });

export default mongoose.models.Price || mongoose.model("Price", priceSchema, "prices");
