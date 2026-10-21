import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { issueToken } from '../middleware/activityAuth.js';

const router = express.Router();

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
    } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ error: 'First name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      passwordHash,
      dob,
      age,
      gender: gender || '',
      privacyPreferences: privacyPreferences || {
        analytics: false,
        personalization: false,
        emergencyAccess: false,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        privacyPreferences: user.privacyPreferences,
      },
      token: issueToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
