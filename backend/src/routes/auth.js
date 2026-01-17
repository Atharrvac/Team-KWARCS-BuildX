import express from 'express';
import bcrypt from 'bcryptjs';
import { db, isDatabaseAvailable } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or, sql } from 'drizzle-orm';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Register user
router.post('/register', validateRequest(schemas.register), async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Registration is currently unavailable. Please try again later.' 
      });
    }

    const { email, phone, password, name, location, farmSize } = req.body;
    
    // Build conditions array for OR query (filter out undefined)
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));
    
    // Check if user exists
    let existingUser = [];
    if (conditions.length > 0) {
      existingUser = await db.select().from(users).where(
        conditions.length === 1 ? conditions[0] : or(...conditions)
      ).limit(1);
    }
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.insert(users).values({
      email,
      phone,
      password: hashedPassword,
      name,
      location,
      farmSize: farmSize ? farmSize.toString() : null,
      role: 'farmer',
    }).returning();
    
    const user = result[0];
    const token = generateToken(user.id, user.email);
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Login is currently unavailable. Please use demo-login for testing.' 
      });
    }

    const { email, phone, password } = req.body;
    
    // Build conditions array for OR query (filter out undefined)
    const conditions = [];
    if (email) conditions.push(eq(users.email, email));
    if (phone) conditions.push(eq(users.phone, phone));
    
    // Find user
    let result = [];
    if (conditions.length > 0) {
      result = await db.select().from(users).where(
        conditions.length === 1 ? conditions[0] : or(...conditions)
      ).limit(1);
    }
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id, user.email);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile (protected)
router.get('/profile/:userId', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Profile service is currently unavailable.' 
      });
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result[0];
    delete user.password; // Don't send password
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (protected)
router.put('/profile/:userId', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        error: 'Database unavailable', 
        message: 'Profile update service is currently unavailable.' 
      });
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { name, location, farmSize } = req.body;
    
    const result = await db.update(users)
      .set({
        name,
        location,
        farmSize: farmSize ? farmSize.toString() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
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

// Demo login (for testing without registration)
router.post('/demo-login', (req, res) => {
  const token = generateToken(1, 'demo@example.com');
  res.json({
    user: {
      id: 1,
      email: 'demo@example.com',
      name: 'Demo Farmer',
      location: 'Indore, MP',
    },
    token,
  });
});

export default router;
