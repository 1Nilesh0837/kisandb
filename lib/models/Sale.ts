import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cropName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerQuintal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    profit: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: "Completed" }
});

export default mongoose.models.Sale || mongoose.model("Sale", saleSchema, "sales");
