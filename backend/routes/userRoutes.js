import express from 'express';
import EmergencyContact from '../models/EmergencyContact.js';
import UserPreference from '../models/UserPreference.js';

const router = express.Router();

router.post('/:userId/emergency-contact', async (req, res) => {
  try {
    const { contactName, phoneNumber, relationship } = req.body;

    if (!contactName || !phoneNumber || !relationship) {
      return res.status(400).json({ error: 'Contact name, phone number, and relationship are required.' });
    }

    const contact = await EmergencyContact.create({
      userId: req.params.userId,
      contactName,
      phoneNumber,
      relationship,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/preferences', async (req, res) => {
  try {
    const { preferredActivities } = req.body;

    const preferences = await UserPreference.create({
      userId: req.params.userId,
      preferredActivities: preferredActivities || [],
    });

    res.status(201).json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
