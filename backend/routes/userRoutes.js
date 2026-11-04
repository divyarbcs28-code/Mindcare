import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import UserPreference from '../models/UserPreference.js';

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function formatEmergencyContact(contact) {
  if (!contact) return null;
  return {
    _id: contact._id,
    contactName: contact.contactName,
    phoneNumber: contact.phoneNumber,
    relationship: contact.relationship,
    name: contact.contactName,
    phone: contact.phoneNumber,
    relation: contact.relationship,
  };
}

// GET /api/users/:userId/emergency-contact
router.get('/:userId/emergency-contact', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const contact = await EmergencyContact.findOne({ userId });
    res.json(formatEmergencyContact(contact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:userId/emergency-contact (Upsert)
router.post('/:userId/emergency-contact', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const contactName = req.body.contactName || req.body.name;
    const phoneNumber = req.body.phoneNumber || req.body.phone;
    const relationship = req.body.relationship || req.body.relation || 'Contact';

    if (!contactName || !phoneNumber) {
      return res.status(400).json({ error: 'Contact name and phone number are required.' });
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      { userId },
      {
        userId,
        contactName: contactName.trim(),
        phoneNumber: phoneNumber.trim(),
        relationship: relationship.trim(),
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Keep user privacyPreferences.emergencyAccess in sync
    await User.findByIdAndUpdate(userId, {
      $set: { 'privacyPreferences.emergencyAccess': true },
    }).catch(() => null);

    res.status(200).json(formatEmergencyContact(contact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/emergency-contact (Alias to upsert)
router.put('/:userId/emergency-contact', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const contactName = req.body.contactName || req.body.name;
    const phoneNumber = req.body.phoneNumber || req.body.phone;
    const relationship = req.body.relationship || req.body.relation || 'Contact';

    if (!contactName || !phoneNumber) {
      return res.status(400).json({ error: 'Contact name and phone number are required.' });
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      { userId },
      {
        userId,
        contactName: contactName.trim(),
        phoneNumber: phoneNumber.trim(),
        relationship: relationship.trim(),
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(userId, {
      $set: { 'privacyPreferences.emergencyAccess': true },
    }).catch(() => null);

    res.status(200).json(formatEmergencyContact(contact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:userId/emergency-contact
router.delete('/:userId/emergency-contact', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    await EmergencyContact.findOneAndDelete({ userId });
    await User.findByIdAndUpdate(userId, {
      $set: { 'privacyPreferences.emergencyAccess': false },
    }).catch(() => null);

    res.json({ message: 'Emergency contact removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/profile (or /api/users/:userId)
router.get('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [contact, prefs] = await Promise.all([
      EmergencyContact.findOne({ userId }),
      UserPreference.findOne({ userId }),
    ]);

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dob: user.dob,
        age: user.age,
        gender: user.gender,
        privacyPreferences: user.privacyPreferences,
        emergencyContact: formatEmergencyContact(contact),
        preferences: prefs?.preferredActivities || [],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/profile
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const { firstName, lastName, privacyPreferences, emergencyContact } = req.body;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = String(firstName).trim();
    if (lastName !== undefined) userUpdate.lastName = String(lastName).trim();
    if (privacyPreferences) {
      userUpdate.privacyPreferences = {
        analytics: Boolean(privacyPreferences.analytics),
        personalization: Boolean(privacyPreferences.personalization),
        emergencyAccess: Boolean(privacyPreferences.emergencyAccess),
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userUpdate },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let savedContact = null;
    if (emergencyContact !== undefined) {
      const contactName = emergencyContact?.contactName || emergencyContact?.name;
      const phoneNumber = emergencyContact?.phoneNumber || emergencyContact?.phone;
      const relationship = emergencyContact?.relationship || emergencyContact?.relation || 'Contact';

      if (contactName && phoneNumber) {
        savedContact = await EmergencyContact.findOneAndUpdate(
          { userId },
          {
            userId,
            contactName: contactName.trim(),
            phoneNumber: phoneNumber.trim(),
            relationship: relationship.trim(),
            updatedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else if (emergencyContact === null || (!contactName && !phoneNumber)) {
        await EmergencyContact.findOneAndDelete({ userId });
        savedContact = null;
      }
    } else {
      savedContact = await EmergencyContact.findOne({ userId });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        privacyPreferences: updatedUser.privacyPreferences,
        emergencyContact: formatEmergencyContact(savedContact),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preferences routes
router.get('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    const preferences = await UserPreference.findOne({ userId });
    res.json(preferences || { preferredActivities: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    const { preferredActivities } = req.body;

    const preferences = await UserPreference.findOneAndUpdate(
      { userId },
      {
        userId,
        preferredActivities: preferredActivities || [],
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
