import express from 'express';
import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import ActivitySession from '../models/ActivitySession.js';
import UserActivity from '../models/UserActivity.js';
import UserBadge from '../models/UserBadge.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { requireActivityAuth } from '../middleware/activityAuth.js';

const router = express.Router();
const MOODS = ['sad', 'stressed', 'angry', 'anxious', 'happy', 'calm', 'bored'];
// The emotion model has no "bored" label, so boredom is recognised from the reflection's words.
const BOREDOM_PATTERN = /\b(bored|boring|boredom|nothing to do)\b/i;
// A reflection older than this no longer describes how the user feels "now".
const CURRENT_MOOD_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Map the emotion model's label (plus sentiment for ambiguous labels) to an activity mood.
function moodFromAnalysis(emotion, sentiment, text = '') {
  const negative = String(sentiment || '').toUpperCase() === 'NEGATIVE';
  const label = String(emotion || '').toLowerCase();
  // Stronger signals (anger, fear) still win over a mention of boredom.
  if (BOREDOM_PATTERN.test(text) && !['anger', 'fear'].includes(label)) return 'bored';
  switch (label) {
    case 'sadness': return 'sad';
    case 'anger':
    case 'disgust': return 'angry';
    case 'fear': return 'anxious';
    case 'joy': return 'happy';
    case 'surprise': return negative ? 'anxious' : 'happy';
    default: return negative ? 'stressed' : 'calm';
  }
}
const catalog = [
  ['gratitude', 'Three Good Things', 'Write down three small things you appreciated today.', 'journaling', 5, 'sad happy calm', '📝', ['Name one small thing that went okay.', 'What made it meaningful?', 'How would you like to remember it?']],
  ['memory-match', 'Memory Match', 'A gentle emoji matching game. Play at your own pace.', 'game', 5, 'sad stressed angry anxious happy bored', '🃏', ['Match all pairs by selecting two cards at a time.']],
  ['breathing', 'Steady Breathing', 'Follow a comfortable breathing rhythm. Stop whenever you wish.', 'breathing', 3, 'stressed angry anxious calm', '🌬️', ['Breathe in gently for 4 counts.', 'Breathe out slowly for 6 counts.', 'Repeat at a pace that feels comfortable. If focusing on breathing feels uncomfortable, stop and try grounding instead.']],
  ['grounding', 'Notice Your Surroundings', 'A short sensory grounding exercise to reconnect with the present.', 'mindfulness', 4, 'stressed anxious sad', '🌿', ['Notice 5 things you can see.', 'Notice 4 things you can feel.', 'Notice 3 things you can hear.', 'Continue gently; skip any step that does not feel comfortable.']],
  ['reflection', 'A Kind Check-In', 'Reflect on what you need right now, without judging your answer.', 'journaling', 5, 'angry anxious calm', '💭', ['What is taking up your attention?', 'What is one kind next step you could take?']],
  ['music-calm', 'Peaceful Sound Break', 'Listen to a freely available ambient soundscape.', 'music', 5, 'sad stressed angry anxious calm', '🎵', ['Open the ambient sound player in a new tab and listen for as long as feels helpful.'], 'https://www.youtube.com/results?search_query=peaceful+ambient+music'],
  ['positive-memory', 'A Bright Moment', 'Capture a positive memory and the details you want to keep.', 'journaling', 5, 'happy', '✨', ['Recall a moment you would like to remember.', 'What could you see, hear, or feel?', 'What would you like to carry forward?']],
  ['mindful-pause', 'Mindful Pause', 'Take a quiet moment to notice your body and surroundings.', 'mindfulness', 3, 'calm happy', '🧘', ['Sit or stand comfortably.', 'Notice one sound, one sensation, and one thing you can see.', 'Let your attention rest there for a few breaths.']],
  ['kind-connection', 'Reach Out Gently', 'Consider a small, comfortable way to connect with someone you trust.', 'challenge', 5, 'sad happy bored', '💌', ['Think of someone who feels safe to contact.', 'You might send a simple hello or share something you appreciate. This is optional; writing a message draft also counts.']],
  ['tiny-puzzle', 'Tiny Word Puzzle', 'Pick a category and name five things in it, at your own pace.', 'game', 3, 'stressed anxious bored', '🧩', ['Choose a category such as fruits, places, or songs.', 'Name five things that fit. Try another category if you like.']],
  ['positive-plan', 'Small Joy Plan', 'Choose one manageable activity that could make today a little brighter.', 'challenge', 4, 'happy bored', '🌈', ['What is one small thing you enjoy?', 'When might you make a little room for it?']],
  ['emotion-note', 'Name What Is Here', 'Put a few words to what you are experiencing, with curiosity.', 'journaling', 4, 'angry anxious', '🖊️', ['If it feels okay, name the feeling or sensations you notice.', 'What might they be asking for?', 'What could help you feel supported right now?']],
].map(([id, title, description, type, durationMinutes, moods, icon, instructions, resourceUrl]) => ({ id, title, description, type, durationMinutes, moods: moods.split(' '), icon, instructions, ...(resourceUrl ? { resourceUrl } : {}) }));
const badges = [
  { id: 'first-step', title: 'First Step', description: 'Complete your first wellness activity.', target: 1, count: (c) => c.length, test: (s) => s.completed.length >= 1 },
  { id: 'getting-started', title: 'Getting Started', description: 'Complete 5 activities.', target: 5, count: (c) => c.length, test: (s) => s.completed.length >= 5 },
  { id: 'consistency-star', title: 'Consistency Star', description: 'Complete activities on 3 different days.', target: 3, count: (c) => new Set(c.map((x) => new Date(x.completedAt).toDateString())).size, test: (s) => new Set(s.completed.map((x) => new Date(x.completedAt).toDateString())).size >= 3 },
  { id: 'wellness-explorer', title: 'Wellness Explorer', description: 'Complete 5 different activity types.', target: 5, count: (c) => new Set(c.map((x) => catalog.find((a) => a.id === x.activityId)?.type).filter(Boolean)).size, test: (s) => new Set(s.completed.map((x) => catalog.find((a) => a.id === x.activityId)?.type).filter(Boolean)).size >= 5 },
  { id: 'game-champion', title: 'Game Champion', description: 'Complete 5 games.', target: 5, count: (c) => c.filter((x) => catalog.find((a) => a.id === x.activityId)?.type === 'game').length, test: (s) => s.completed.filter((x) => catalog.find((a) => a.id === x.activityId)?.type === 'game').length >= 5 },
  { id: 'mindful-moments', title: 'Mindful Moments', description: 'Complete 5 breathing or mindfulness activities.', target: 5, count: (c) => c.filter((x) => ['breathing', 'mindfulness'].includes(catalog.find((a) => a.id === x.activityId)?.type)).length, test: (s) => s.completed.filter((x) => ['breathing', 'mindfulness'].includes(catalog.find((a) => a.id === x.activityId)?.type)).length >= 5 },
  { id: 'music-break', title: 'Music Break', description: 'Complete 5 music activities.', target: 5, count: (c) => c.filter((x) => catalog.find((a) => a.id === x.activityId)?.type === 'music').length, test: (s) => s.completed.filter((x) => catalog.find((a) => a.id === x.activityId)?.type === 'music').length >= 5 },
  { id: 'reflection-hero', title: 'Reflection Hero', description: 'Complete 5 journaling or reflection activities.', target: 5, count: (c) => c.filter((x) => ['journaling', 'reflection'].includes(catalog.find((a) => a.id === x.activityId)?.type)).length, test: (s) => s.completed.filter((x) => ['journaling', 'reflection'].includes(catalog.find((a) => a.id === x.activityId)?.type)).length >= 5 },
];

router.get('/catalog', async (req, res) => {
  try { const stored = await Activity.find(); res.json(stored.length ? stored : catalog); }
  catch { res.status(500).json({ error: 'Unable to load activities.' }); }
});
// The user's current mood, derived from their most recent analysed reflection.
router.get('/current-mood', requireActivityAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.activityUserId)) return res.json({ mood: null });
    const latest = await AnalysisResult.findOne({
      userId: req.activityUserId,
      createdAt: { $gte: new Date(Date.now() - CURRENT_MOOD_WINDOW_MS) },
    }).sort({ createdAt: -1 }).lean();
    if (!latest) return res.json({ mood: null });
    res.json({
      mood: moodFromAnalysis(latest.emotionCategory, latest.sentimentCategory, latest.english_text || latest.original_text),
      emotion: latest.emotionCategory || 'neutral',
      emotionConfidence: latest.confidenceScore || 0,
      sentiment: latest.sentimentCategory || null,
      detectedAt: latest.createdAt,
    });
  } catch { res.status(500).json({ error: 'Unable to load your current mood.' }); }
});

router.get('/recommendations', requireActivityAuth, async (req, res) => {
  const mood = String(req.query.mood || '').toLowerCase();
  if (!MOODS.includes(mood)) return res.status(400).json({ error: 'Select a supported mood to see recommendations.' });
  try {
    // Rank the mood's activities so the list changes with the user's history: fresh activities first,
    // then ones not done recently; anything completed today or skipped this week goes to the end.
    const recent = await UserActivity.find({ userId: req.activityUserId, updatedAt: { $gte: new Date(Date.now() - 7 * DAY_MS) } }).lean();
    const penalty = (activityId) => recent.filter((r) => r.activityId === activityId).reduce((sum, r) => {
      if (r.status === 'completed') return sum + (Date.now() - new Date(r.completedAt || r.updatedAt) < DAY_MS ? 3 : 1);
      if (r.status === 'skipped') return sum + 2;
      return sum;
    }, 0);
    const activities = catalog
      .filter((activity) => activity.moods.includes(mood))
      .map((activity) => ({ activity, score: penalty(activity.id) + Math.random() * 0.5 }))
      .sort((a, b) => a.score - b.score)
      .map(({ activity }) => activity);

    for (const activity of activities) {
      const exists = await UserActivity.exists({ userId: req.activityUserId, activityId: activity.id, status: { $in: ['recommended', 'in_progress', 'completed'] } });
      if (!exists) await UserActivity.create({ userId: req.activityUserId, activityId: activity.id, mood, status: 'recommended' });
    }
    res.json({ mood, activities });
  } catch { res.status(500).json({ error: 'Unable to load recommendations.' }); }
});
router.get('/progress', requireActivityAuth, async (req, res) => {
  try {
    const records = await UserActivity.find({ userId: req.activityUserId }).sort({ updatedAt: -1 }).lean();
    const completed = records.filter((record) => record.status === 'completed');
    const earnedRecords = await UserBadge.find({ userId: req.activityUserId }).lean();
    const earned = earnedRecords.map((record) => ({ id: record.badgeId, title: badges.find((badge) => badge.id === record.badgeId)?.title, description: badges.find((badge) => badge.id === record.badgeId)?.description, unlockedAt: record.unlockedAt }));
    const history = records.map((record) => ({ ...record, activity: catalog.find((activity) => activity.id === record.activityId) }));
    const recommendationCount = records.length;
    res.json({ counts: { recommended: recommendationCount, started: records.filter((x) => x.startedAt).length, completed: completed.length, skipped: records.filter((x) => x.status === 'skipped').length, totalCompleted: completed.length, completionPercentage: recommendationCount ? Math.round(completed.length / recommendationCount * 100) : 0 }, history, badges: badges.map((badge) => { const amount = badge.count(completed); return { id: badge.id, title: badge.title, description: badge.description, earned: earned.some((item) => item.id === badge.id), progress: Math.min(amount, badge.target), target: badge.target, unlockedAt: earned.find((item) => item.id === badge.id)?.unlockedAt || null }; }) });
  } catch { res.status(500).json({ error: 'Unable to load activity progress.' }); }
});
router.post('/progress', requireActivityAuth, async (req, res) => {
  try {
    const { activityId, mood, action, durationMinutes } = req.body;
    const activity = catalog.find((item) => item.id === activityId);
    if (!activity || !MOODS.includes(mood)) return res.status(400).json({ error: 'Valid activityId and mood are required.' });
    if (!['start', 'complete', 'skip'].includes(action)) return res.status(400).json({ error: 'Action must be start, complete, or skip.' });
    if (action === 'complete' && (!Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 240)) return res.status(400).json({ error: 'Completion duration must be between 0 and 240 minutes.' });
    let record = await UserActivity.findOne({ userId: req.activityUserId, activityId, status: { $in: ['recommended', 'in_progress'] } }).sort({ recommendedAt: -1 });
    if (action === 'skip') {
      if (!record) record = new UserActivity({ userId: req.activityUserId, activityId, mood });
      if (record.status === 'completed') return res.status(409).json({ error: 'Completed activities cannot be skipped.' });
      record.status = 'skipped'; await record.save();
      return res.json({ record, newBadges: [] });
    }
    if (!record) record = new UserActivity({ userId: req.activityUserId, activityId, mood });
    if (action === 'start') {
      if (record.status === 'recommended') { record.status = 'in_progress'; record.startedAt = new Date(); await record.save(); }
      return res.json({ record, newBadges: [] });
    }
    if (record.status === 'completed') return res.json({ record, newBadges: [] });
    record.status = 'completed'; record.startedAt ||= new Date(); record.completedAt = new Date(); record.durationMinutes = Math.round(durationMinutes * 10) / 10; await record.save();
    const completed = await UserActivity.find({ userId: req.activityUserId, status: 'completed' }).lean();
    const earnedBefore = badges.filter((badge) => badge.test({ completed: completed.filter((x) => x._id.toString() !== record._id.toString()) })).map((x) => x.id);
    const newlyQualified = badges.filter((badge) => !earnedBefore.includes(badge.id) && badge.test({ completed }));
    const newBadges = [];
    for (const badge of newlyQualified) {
      const result = await UserBadge.updateOne({ userId: req.activityUserId, badgeId: badge.id }, { $setOnInsert: { unlockedAt: new Date() } }, { upsert: true });
      if (result.upsertedCount) newBadges.push({ id: badge.id, title: badge.title, description: badge.description });
    }
    return res.json({ record, newBadges });
  } catch (error) { res.status(500).json({ error: 'Unable to save activity progress.' }); }
});

// Keep the legacy session endpoint compatible while deriving ownership from the signed session.
router.post('/sessions', requireActivityAuth, async (req, res) => {
  try {
    const { activityId, durationMinutes } = req.body;
    if (!mongoose.isValidObjectId(activityId) || !Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 240) return res.status(400).json({ error: 'Valid activityId and durationMinutes are required.' });
    const session = await ActivitySession.create({ userId: req.activityUserId, activityId, durationMinutes });
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
});
export default router;
