import express from 'express';
import Insight from '../models/Insight.js';
import Recommendation from '../models/Recommendation.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const insights = await Insight.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const { reflectionId, combinedLabel, trendStatus } = req.body;

    const insight = await Insight.create({
      userId: req.params.userId,
      reflectionId,
      combinedLabel,
      trendStatus,
      insightId: `insight_${Date.now()}`,
    });

    const recommendation = await Recommendation.create({
      userId: req.params.userId,
      insightId: insight._id,
      recommendation: 'Take a short breathing exercise.',
      reasonText: 'Your recent pattern suggests a need for grounding and calm.',
      recommendationId: `recommendation_${Date.now()}`,
    });

    res.status(201).json({ insight, recommendation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
