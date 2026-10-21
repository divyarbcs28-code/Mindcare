import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MoodEntry from './models/MoodEntry.js';

dotenv.config();

const demoEntries = [
  ['happy', 'Demo entry: enjoyed a relaxed morning.'],
  ['calm', 'Demo entry: took a few quiet minutes to reset.'],
  ['neutral', 'Demo entry: an ordinary day with a steady routine.'],
  ['tired', 'Demo entry: felt low on energy after a busy day.'],
  ['anxious', 'Demo entry: had several things on my mind.'],
  ['good', 'Demo entry: finished a task I had been putting off.'],
  ['sad', 'Demo entry: could have used more rest and support.'],
  ['calm', 'Demo entry: listened to music during a break.'],
  ['stressed', 'Demo entry: the schedule felt a little overwhelming.'],
  ['happy', 'Demo entry: spent time doing something I enjoy.'],
  ['neutral', 'Demo entry: took the day one step at a time.'],
  ['hopeful', 'Demo entry: looking forward to a small goal this week.'],
];

async function seedMoodEntries() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to the project-root .env file.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const now = new Date();
  let inserted = 0;
  for (let index = 0; index < demoEntries.length; index += 1) {
    const [mood, note] = demoEntries[index];
    const marker = `[demo-mood-${String(index + 1).padStart(2, '0')}]`;
    const exists = await MoodEntry.exists({ note: { $regex: `^${marker}` } });
    if (exists) continue;

    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - (demoEntries.length - index - 1));
    await MoodEntry.create({ mood, note: `${marker} ${note}`, createdAt });
    inserted += 1;
  }

  console.log(`Mood demo seed complete: inserted ${inserted}; ${demoEntries.length} demo entries are available.`);
}

seedMoodEntries()
  .catch((error) => {
    console.error(`Mood demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
