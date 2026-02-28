import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const options = {};

if (!uri && process.env.NODE_ENV === 'production') {
    console.warn('Warning: MONGODB_URI is not defined');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient | null>;

if (!uri) {
    clientPromise = Promise.resolve(null);
} else {
    if (process.env.NODE_ENV === 'development') {
        let globalWithMongo = global as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient | null>;
        };

        if (!globalWithMongo._mongoClientPromise) {
            client = new MongoClient(uri, options);
            globalWithMongo._mongoClientPromise = client.connect();
        }
        clientPromise = globalWithMongo._mongoClientPromise;
    } else {
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function connectToDatabase() {
    const client = await clientPromise;
    if (!client) throw new Error("MongoDB client is null");
    return {
        client,
        db: client.db()
    };
}
