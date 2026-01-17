import { pgTable, serial, text, integer, decimal, timestamp, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('farmer'),
  location: varchar('location', { length: 255 }),
  farmSize: decimal('farm_size', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Market prices table
export const marketPrices = pgTable('market_prices', {
  id: serial('id').primaryKey(),
  crop: varchar('crop', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  change: decimal('change', { precision: 5, scale: 2 }),
  volume: integer('volume'),
  type: varchar('type', { length: 50 }), // NCDEX, Spot, etc.
  location: varchar('location', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Trading positions table
export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  crop: varchar('crop', { length: 100 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // long, short
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  entryPrice: decimal('entry_price', { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('open'), // open, closed
  pnl: decimal('pnl', { precision: 12, scale: 2 }),
  openedAt: timestamp('opened_at').defaultNow(),
  closedAt: timestamp('closed_at'),
});

// Forward contracts table
export const contracts = pgTable('contracts', {
  id: serial('id').primaryKey(),
  farmerId: integer('farmer_id').references(() => users.id),
  buyerId: integer('buyer_id'),
  crop: varchar('crop', { length: 100 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  deliveryStart: timestamp('delivery_start'),
  deliveryEnd: timestamp('delivery_end'),
  status: varchar('status', { length: 50 }).default('pending'), // pending, active, executed, cancelled
  terms: jsonb('terms'),
  blockchainTxHash: text('blockchain_tx_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  executedAt: timestamp('executed_at'),
});

// Price alerts table
export const priceAlerts = pgTable('price_alerts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  crop: varchar('crop', { length: 100 }).notNull(),
  targetPrice: decimal('target_price', { precision: 10, scale: 2 }).notNull(),
  condition: varchar('condition', { length: 20 }).notNull(), // above, below
  active: boolean('active').default(true),
  triggered: boolean('triggered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  triggeredAt: timestamp('triggered_at'),
});

// AI predictions table
export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  crop: varchar('crop', { length: 100 }).notNull(),
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }).notNull(),
  predictedPrice: decimal('predicted_price', { precision: 10, scale: 2 }).notNull(),
  predictionDate: timestamp('prediction_date').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  factors: jsonb('factors'),
  createdAt: timestamp('created_at').defaultNow(),
});

// AutoHedge enrollments table
export const autoHedgeEnrollments = pgTable('autohedge_enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  crop: varchar('crop', { length: 100 }).notNull(),
  totalAcres: decimal('total_acres', { precision: 10, scale: 2 }).notNull(),
  enrolledAcres: decimal('enrolled_acres', { precision: 10, scale: 2 }).notNull(),
  targetPrice: decimal('target_price', { precision: 10, scale: 2 }),
  autoSelling: boolean('auto_selling').default(true),
  pricingWindowStart: timestamp('pricing_window_start'),
  pricingWindowEnd: timestamp('pricing_window_end'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AutoHedge transactions table
export const autoHedgeTransactions = pgTable('autohedge_transactions', {
  id: serial('id').primaryKey(),
  enrollmentId: integer('enrollment_id').references(() => autoHedgeEnrollments.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp('transaction_date').defaultNow(),
  type: varchar('type', { length: 50 }), // daily_sale, boost_sale
});

// Learning modules table
export const learningModules = pgTable('learning_modules', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }),
  difficulty: varchar('difficulty', { length: 50 }),
  duration: integer('duration'), // in minutes
  order: integer('order'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User progress table
export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  moduleId: integer('module_id').references(() => learningModules.id),
  completed: boolean('completed').default(false),
  progress: decimal('progress', { precision: 5, scale: 2 }).default('0'), // 0-100
  score: integer('score'), // Quiz score
  timeSpent: integer('time_spent'), // in seconds
  lastAccessed: timestamp('last_accessed'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Learning lessons table
export const learningLessons = pgTable('learning_lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => learningModules.id),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // video, text, interactive, quiz
  content: text('content').notNull(),
  duration: integer('duration'), // in minutes
  order: integer('order').notNull(),
  videoUrl: text('video_url'),
  resources: jsonb('resources'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Learning quizzes table
export const learningQuizzes = pgTable('learning_quizzes', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => learningLessons.id),
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // Array of options
  correctAnswer: integer('correct_answer').notNull(), // Index of correct option
  explanation: text('explanation'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// User quiz attempts table
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  lessonId: integer('lesson_id').references(() => learningLessons.id),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  answers: jsonb('answers'), // User's answers
  passed: boolean('passed').default(false),
  attemptNumber: integer('attempt_number').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Learning certificates table
export const learningCertificates = pgTable('learning_certificates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  moduleId: integer('module_id').references(() => learningModules.id),
  certificateId: varchar('certificate_id', { length: 100 }).unique().notNull(),
  issuedDate: timestamp('issued_date').defaultNow(),
  expiryDate: timestamp('expiry_date'),
  score: integer('score'),
  verified: boolean('verified').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Learning achievements table
export const learningAchievements = pgTable('learning_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  achievementType: varchar('achievement_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  earnedDate: timestamp('earned_date').defaultNow(),
});

// Learning bookmarks table
export const learningBookmarks = pgTable('learning_bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  lessonId: integer('lesson_id').references(() => learningLessons.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Wallet transactions table
export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(), // deposit, withdrawal, trade_pnl
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }), // price_alert, contract, trade, system
  read: boolean('read').default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow(),
});
