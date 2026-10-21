import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

// Copies every collection from the local database into the deployed (Atlas) database.
// Documents are upserted by _id, so running it twice does not create duplicates.
const SOURCE_URI = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017/mindcare';
const TARGET_URI = process.env.TARGET_MONGO_URI;

async function copyLocalToAtlas() {
  if (!TARGET_URI) {
    throw new Error('TARGET_MONGO_URI is missing. Set it to the same MONGO_URI your deployed backend uses.');
  }

  const source = new MongoClient(SOURCE_URI);
  const target = new MongoClient(TARGET_URI);
  await source.connect();
  await target.connect();

  // db() with no name uses the database in the URI path, or "test" if there is none (same as Mongoose).
  const sourceDb = source.db();
  const targetDb = target.db();
  console.log(`Copying ${sourceDb.databaseName} (local) -> ${targetDb.databaseName} (target)`);

  for (const { name } of await sourceDb.listCollections({ type: 'collection' }).toArray()) {
    const docs = await sourceDb.collection(name).find().toArray();
    if (docs.length === 0) continue;

    const result = await targetDb.collection(name).bulkWrite(
      docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
    );
    console.log(`${name}: ${docs.length} docs (${result.upsertedCount} new, ${result.modifiedCount} updated)`);
  }

  await source.close();
  await target.close();
}

copyLocalToAtlas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
