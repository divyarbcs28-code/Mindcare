import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import UserPreference from '../models/UserPreference.js';
import { issueToken } from '../middleware/activityAuth.js';

const router = express.Router();

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

router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      dob,
      age,
      gender,
      privacyPreferences,
      emergencyContact,
      preferences,
      preferredActivities,
    } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const contactProvided = Boolean(
      emergencyContact &&
      (emergencyContact.contactName || emergencyContact.name) &&
      (emergencyContact.phoneNumber || emergencyContact.phone)
    );

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      dob: dob || undefined,
      age: age || undefined,
      gender: gender || '',
      privacyPreferences: {
        analytics: privacyPreferences?.analytics ?? false,
        personalization: privacyPreferences?.personalization ?? false,
        emergencyAccess: privacyPreferences?.emergencyAccess ?? contactProvided,
      },
    });

    let savedEmergencyContact = null;
    if (contactProvided) {
      const contactName = (emergencyContact.contactName || emergencyContact.name).trim();
      const phoneNumber = (emergencyContact.phoneNumber || emergencyContact.phone).trim();
      const relationship = (emergencyContact.relationship || emergencyContact.relation || 'Contact').trim();

      savedEmergencyContact = await EmergencyContact.create({
        userId: user._id,
        contactName,
        phoneNumber,
        relationship: relationship || 'Contact',
      });
    }

    const rawPrefs = Array.isArray(preferences) ? preferences : (Array.isArray(preferredActivities) ? preferredActivities : []);
    if (rawPrefs.length > 0) {
      try {
        await UserPreference.create({
          userId: user._id,
          preferredActivities: rawPrefs,
        });
      } catch (prefErr) {
        console.warn('Preferences save warning on registration:', prefErr.message);
      }
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        privacyPreferences: user.privacyPreferences,
        emergencyContact: formatEmergencyContact(savedEmergencyContact),
      },
      token: issueToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const [contact, prefs] = await Promise.all([
      EmergencyContact.findOne({ userId: user._id }),
      UserPreference.findOne({ userId: user._id }),
    ]);

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        privacyPreferences: user.privacyPreferences,
        emergencyContact: formatEmergencyContact(contact),
        preferences: prefs?.preferredActivities || [],
      },
      token: issueToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
