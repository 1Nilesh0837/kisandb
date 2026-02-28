import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Crop from '@/lib/models/Crop';
import Sale from '@/lib/models/Sale';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        await dbConnect();

        const inventory = await Crop.find({ userId }).sort({ updatedAt: -1 });
        const sales = await Sale.find({ userId }).limit(10).sort({ date: -1 });

        // Calculate real stats
        const totalStock = inventory.reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0);

        // This month sales
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthSalesData = await Sale.find({
            userId,
            date: { $gte: firstDayOfMonth }
        });
        const thisMonthSales = thisMonthSalesData.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);

        // Top crop by quantity
        const topCropRecord = [...inventory].sort((a: any, b: any) => b.quantity - a.quantity)[0];

        return NextResponse.json({
            inventory,
            sales,
            stats: {
                totalStock,
                thisMonthSales,
                topCrop: topCropRecord ? topCropRecord.cropName : "N/A",
                profit: "Real-time"
            }
        });

    } catch (error: any) {
        console.error("API Error (GET Data):", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
