/**
 * 🔒 RECIFY SECURITY CONFIGURATION
 * Bank-level security for production apps
 */

export const SECURITY_CONFIG = {
  // ========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ========================================================================
  
  auth: {
    // Session Configuration
    session: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      renewThreshold: 60 * 60 * 1000, // 1 hour before expiry
      maxConcurrentSessions: 3,
      requireReauth: ['profile-edit', 'payment', 'delete-account'],
      idleTimeout: 15 * 60 * 1000, // 15 minutes of inactivity
    },

    // Password Requirements
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventPersonalInfo: true,
      expiryDays: 90,
      historyCount: 5, // Can't reuse last 5 passwords
    },

    // Multi-Factor Authentication
    mfa: {
      enabled: true,
      methods: ['totp', 'sms', 'email'],
      required: false,
      gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days to set up
    },

    // Biometric Authentication
    biometric: {
      enabled: true,
      methods: ['fingerprint', 'faceRecognition'],
      fallbackToPassword: true,
      requirePasswordPeriodically: true,
      passwordRequiredEvery: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },

  // ========================================================================
  // DATA ENCRYPTION
  // ========================================================================

  encryption: {
    // Algorithm Configuration
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    iterations: 100000,
    saltLength: 32,
    tagLength: 16,

    // Fields to Encrypt
    encryptedFields: [
      'password',
      'email',
      'phone',
      'address',
      'paymentInfo',
      'personalNotes',
    ],

    // TLS/SSL Configuration
    tls: {
      minVersion: 'TLSv1.3',
      ciphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
      ],
      certificatePinning: true,
    },
  },

  // ========================================================================
  // API SECURITY
  // ========================================================================

  api: {
    // Rate Limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    },

    // CORS Configuration
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://recify.app', 'https://www.recify.app']
        : ['http://localhost:3000', 'http://localhost:8081'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
      maxAge: 86400, // 24 hours
    },

    // Security Headers
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [\"'self'\"],
          scriptSrc: [\"'self'\", \"'unsafe-inline'\"],
          styleSrc: [\"'self'\", \"'unsafe-inline'\"],
          imgSrc: [\"'self'\", 'data:', 'https:'],
          connectSrc: [\"'self'\", 'https://api.recify.app'],
          fontSrc: [\"'self'\"],
          objectSrc: [\"'none'\"],
          mediaSrc: [\"'self'\"],
          frameSrc: [\"'none'\"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    },

    // API Key Management
    apiKey: {
      rotation: 90 * 24 * 60 * 60 * 1000, // 90 days
      maxKeys: 5,
      requireApproval: true,
      auditLogging: true,
    },
  },

  // ========================================================================
  // INPUT VALIDATION & SANITIZATION
  // ========================================================================

  validation: {
    // Sanitization Rules
    sanitize: {
      removeScripts: true,
      removeHtml: true,
      trimWhitespace: true,
      normalizeUnicode: true,
      preventSqlInjection: true,
      preventXss: true,
    },

    // Validation Rules
    rules: {
      email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
      phone: /^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/,
      url: /^https?:\\/\\/.+/,
      username: /^[a-zA-Z0-9_-]{3,20}$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$/,
    },

    // File Upload Restrictions
    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      scanForMalware: true,
      quarantineUnsafe: true,
    },
  },

  // ========================================================================
  // AUDIT & LOGGING
  // ========================================================================

  audit: {
    // Events to Log
    logEvents: [
      'login',
      'logout',
      'passwordChange',
      'mfaEnabled',
      'mfaDisabled',
      'profileUpdate',
      'paymentProcessed',
      'dataExport',
      'accountDelete',
      'suspiciousActivity',
      'failedLogin',
      'apiKeyCreated',
      'apiKeyRevoked',
    ],

    // Retention Policy
    retention: {
      days: 90,
      archiveAfter: 30,
      deleteAfter: 365,
    },

    // Sensitive Operations
    sensitiveOps: {
      requireApproval: true,
      requireMfa: true,
      notifyUser: true,
      logDetails: true,
    },
  },

  // ========================================================================
  // COMPLIANCE & PRIVACY
  // ========================================================================

  compliance: {
    // GDPR Compliance
    gdpr: {
      enabled: true,
      dataProcessingAgreement: true,
      privacyPolicy: true,
      consentManagement: true,
      rightToBeForgettenSupport: true,
      dataPortability: true,
    },

    // CCPA Compliance
    ccpa: {
      enabled: true,
      privacyPolicy: true,
      optOutMechanism: true,
      dataAccessRequests: true,
      deleteRequests: true,
    },

    // Data Minimization
    dataMinimization: {
      collectOnlyNecessary: true,
      deleteUnusedData: true,
      anonymizeWhenPossible: true,
      pseudonymizePersonalData: true,
    },

    // Privacy by Design
    privacyByDesign: {
      defaultPrivate: true,
      encryptionByDefault: true,
      minimumPermissions: true,
      userControl: true,
    },
  },

  // ========================================================================
  // THREAT DETECTION & PREVENTION
  // ========================================================================

  threatDetection: {
    // Anomaly Detection
    anomaly: {
      enabled: true,
      loginLocationChange: true,
      unusualActivityPattern: true,
      multipleFailedAttempts: true,
      rapidApiCalls: true,
    },

    // Brute Force Protection
    bruteForce: {
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      progressiveLockout: true,
      requireCaptcha: true,
    },

    // DDoS Protection
    ddos: {
      enabled: true,
      rateLimit: true,
      ipBlacklist: true,
      trafficAnalysis: true,
    },

    // Malware Detection
    malware: {
      scanUploads: true,
      quarantineInfected: true,
      notifyUser: true,
      reportToAuthorities: true,
    },
  },

  // ========================================================================
  // SECURE STORAGE
  // ========================================================================

  storage: {
    // Local Storage
    local: {
      encryption: true,
      algorithm: 'aes-256-gcm',
      clearOnLogout: true,
      clearOnAppUninstall: true,
    },

    // Secure Keychain/Keystore
    keychain: {
      enabled: true,
      storeTokens: true,
      storeSensitiveData: true,
      requireBiometric: true,
    },

    // Database Encryption
    database: {
      encryption: true,
      algorithm: 'aes-256-gcm',
      backupEncryption: true,
      backupVerification: true,
    },
  },

  // ========================================================================
  // CERTIFICATE PINNING
  // ========================================================================

  certificatePinning: {
    enabled: true,
    pins: {
      'api.recify.app': [
        'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      ],
    },
    allowBackupPin: true,
    pinningTimeout: 60000, // 1 minute
  },
};

export default SECURITY_CONFIG;
