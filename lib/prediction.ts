/**
 * Polynomial Regression (Degree 2) implementation in TypeScript
 * Formula: y = ax^2 + bx + c
 */

export interface PredictionResult {
    date: string;
    predictedPrice: number;
    day: number;
}

export interface PredictionSummary {
    crop: string;
    predictions: PredictionResult[];
    bestSellDate: string;
    bestSellPrice: number;
    confidence: number;
}

export function predictCropPrices(
    cropName: string,
    historicalData: { date: Date; modalPrice: number }[],
    daysToPredict: number = 7
): PredictionSummary {
    if (historicalData.length < 3) {
        throw new Error("Insufficient data for prediction (min 3 points required)");
    }

    // Sort by date and convert to X (days from start) and Y (prices)
    const sortedData = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());
    const minDate = sortedData[0].date.getTime();

    const X = sortedData.map(d => (d.date.getTime() - minDate) / (1000 * 60 * 60 * 24));
    const Y = sortedData.map(d => d.modalPrice);

    // Solve for a, b, c using Least Squares
    // Sums for the normal equations
    let n = X.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
    let sumY = 0, sumXY = 0, sumX2Y = 0;

    for (let i = 0; i < n; i++) {
        const x = X[i];
        const y = Y[i];
        const x2 = x * x;

        sumX += x;
        sumX2 += x2;
        sumX3 += x2 * x;
        sumX4 += x2 * x2;
        sumY += y;
        sumXY += x * y;
        sumX2Y += x2 * y;
    }

    // Normal Equations Matrix (3x3):
    // [ n    sumX   sumX2 ] [ c ]   [ sumY   ]
    // [ sumX sumX2  sumX3 ] [ b ] = [ sumXY  ]
    // [ sumX2 sumX3 sumX4 ] [ a ]   [ sumX2Y ]

    // Solving using Cramer's Rule or Gaussian Elimination (simple 3x3 solver)
    const matrix = [
        [n, sumX, sumX2],
        [sumX, sumX2, sumX3],
        [sumX2, sumX3, sumX4]
    ];
    const vector = [sumY, sumXY, sumX2Y];

    const result = solve3x3(matrix, vector);
    const [c, b, a] = result;

    // Generate predictions
    const predictions: PredictionResult[] = [];
    const lastX = X[X.length - 1];
    const today = new Date();

    for (let i = 1; i <= daysToPredict; i++) {
        const futureX = lastX + i;
        const predictedPrice = a * futureX * futureX + b * futureX + c;

        const futureDate = new Date();
        futureDate.setDate(today.getDate() + i);

        predictions.push({
            date: futureDate.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
            predictedPrice: Math.round(predictedPrice),
            day: i
        });
    }

    const bestPrediction = [...predictions].sort((p1, p2) => p2.predictedPrice - p1.predictedPrice)[0];

    // Simple R-squared for confidence
    let ssRes = 0;
    let ssTot = 0;
    const yMean = sumY / n;
    for (let i = 0; i < n; i++) {
        const x = X[i];
        const y = Y[i];
        const yPred = a * x * x + b * x + c;
        ssRes += Math.pow(y - yPred, 2);
        ssTot += Math.pow(y - yMean, 2);
    }
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.min(Math.max(Math.round(rSquared * 100), 10), 99);

    return {
        crop: cropName,
        predictions,
        bestSellDate: bestPrediction.date,
        bestSellPrice: bestPrediction.predictedPrice,
        confidence
    };
}

// Simple 3x3 linear system solver using determinants (Cramer's rule)
function solve3x3(m: number[][], v: number[]): number[] {
    const det = determinant3x3(m);
    if (Math.abs(det) < 0.000001) {
        // Fallback to linear if determinant is zero
        return [v[0] / m[0][0], 0, 0];
    }

    const det0 = determinant3x3([
        [v[0], m[0][1], m[0][2]],
        [v[1], m[1][1], m[1][2]],
        [v[2], m[2][1], m[2][2]]
    ]);
    const det1 = determinant3x3([
        [m[0][0], v[0], m[0][2]],
        [m[1][0], v[1], m[1][2]],
        [m[2][0], v[2], m[2][2]]
    ]);
    const det2 = determinant3x3([
        [m[0][0], m[0][1], v[0]],
        [m[1][0], m[1][1], v[1]],
        [m[2][0], m[2][1], v[2]]
    ]);

    return [det0 / det, det1 / det, det2 / det];
}

function determinant3x3(m: number[][]): number {
    return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
}
