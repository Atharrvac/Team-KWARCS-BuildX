import { db } from '../src/db/index.js';
import { users, marketPrices, learningModules } from '../src/db/schema.js';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');
  
  try {
    // Create demo user
    console.log('👤 Creating demo user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const demoUser = await db.insert(users).values({
      email: 'demo@example.com',
      phone: '+919876543210',
      password: hashedPassword,
      name: 'Demo Farmer',
      location: 'Indore, Madhya Pradesh',
      farmSize: '100',
      role: 'farmer',
    }).returning();
    
    console.log('✅ Demo user created:', demoUser[0].email);
    
    // Seed market prices
    console.log('\n📊 Seeding market prices...');
    const crops = [
      { crop: 'soybean', price: 4820, change: 2.1, volume: 15000, type: 'NCDEX' },
      { crop: 'mustard', price: 6450, change: -0.4, volume: 12000, type: 'Spot' },
      { crop: 'groundnut', price: 5800, change: 3.8, volume: 8000, type: 'Spot' },
      { crop: 'sunflower', price: 6200, change: 1.5, volume: 10000, type: 'Spot' },
    ];
    
    for (const crop of crops) {
      await db.insert(marketPrices).values({
        crop: crop.crop,
        price: crop.price.toString(),
        change: crop.change.toString(),
        volume: crop.volume,
        type: crop.type,
        timestamp: new Date(),
      });
    }
    
    console.log('✅ Market prices seeded');
    
    // Seed learning modules
    console.log('\n📚 Seeding learning modules...');
    const modules = [
      {
        title: 'Introduction to Hedging',
        description: 'Learn the basics of price hedging for farmers',
        content: 'Hedging is a risk management strategy...',
        category: 'basics',
        difficulty: 'beginner',
        duration: 15,
        order: 1,
      },
      {
        title: 'Understanding Futures Contracts',
        description: 'How futures contracts work in agricultural markets',
        content: 'Futures contracts are agreements to buy or sell...',
        category: 'futures',
        difficulty: 'intermediate',
        duration: 20,
        order: 2,
      },
      {
        title: 'Forward Contracts Explained',
        description: 'Direct contracts with buyers',
        content: 'Forward contracts are customized agreements...',
        category: 'contracts',
        difficulty: 'beginner',
        duration: 10,
        order: 3,
      },
    ];
    
    for (const module of modules) {
      await db.insert(learningModules).values(module);
    }
    
    console.log('✅ Learning modules seeded');
    
    console.log('\n✨ Database setup complete!\n');
    console.log('Demo credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: demo123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
