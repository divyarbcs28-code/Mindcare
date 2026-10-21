import express from 'express';
import SafetyFlag from '../models/SafetyFlag.js';

const router = express.Router();

router.post('/:userId', async (req, res) => {
  try {
    const { tier, triggerReason } = req.body;

    const flag = await SafetyFlag.create({
      userId: req.params.userId,
      tier,
      triggerReason,
      flagId: `flag_${Date.now()}`,
    });

    res.status(201).json(flag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
