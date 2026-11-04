import express from 'express';
import SafetyFlag from '../models/SafetyFlag.js';
import EmergencyContact from '../models/EmergencyContact.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/:userId', async (req, res) => {
  try {
    const { tier, triggerReason } = req.body;
    const { userId } = req.params;

    const flag = await SafetyFlag.create({
      userId,
      tier: tier || 'low',
      triggerReason: triggerReason || 'User triggered support',
      flagId: `flag_${Date.now()}`,
    });

    let emergencyContact = null;
    if (tier === 'high') {
      const user = await User.findById(userId);
      if (user?.privacyPreferences?.emergencyAccess) {
        emergencyContact = await EmergencyContact.findOne({ userId });
      }
    }

    res.status(201).json({
      flag,
      emergencyContact: emergencyContact ? {
        contactName: emergencyContact.contactName,
        phoneNumber: emergencyContact.phoneNumber,
        relationship: emergencyContact.relationship,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const flags = await SafetyFlag.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(flags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
