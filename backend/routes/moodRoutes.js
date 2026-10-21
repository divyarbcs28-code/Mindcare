import express from 'express';
import MoodEntry from '../models/MoodEntry.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const entries = await MoodEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { mood, note } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const entry = await MoodEntry.create({ mood, note });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
