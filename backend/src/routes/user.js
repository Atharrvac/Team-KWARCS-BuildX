import express from 'express';
import { db, isDatabaseAvailable } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Profile service is currently unavailable.' 
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const result = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result[0];
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Profile update service is currently unavailable.' 
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { name, phone, email, location, farmSize } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (location !== undefined) updateData.location = location;
    if (farmSize !== undefined) updateData.farmSize = farmSize;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateData.updatedAt = new Date();
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, req.user.userId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result[0];
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
