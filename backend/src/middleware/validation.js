// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    console.log('[Validation] Validating request body:', req.body);
    const result = schema.validate(req.body);
    if (result.error) {
      console.log('[Validation] Validation failed:', result.error.details);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: result.error.details.map(d => d.message) 
      });
    }
    console.log('[Validation] Validation passed');
    next();
  };
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation helper
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

// Common validation schemas
export const schemas = {
  register: {
    validate: (data) => {
      const errors = [];
      if (!data.email && !data.phone) {
        errors.push('Email or phone required');
      }
      if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
      }
      if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Invalid phone format');
      }
      if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Name is required');
      }
      
      return { error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null };
    }
  },
  
  login: {
    validate: (data) => {
      const errors = [];
      if (!data.email && !data.phone) {
        errors.push('Email or phone required');
      }
      if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
      }
      if (!data.password) {
        errors.push('Password is required');
      }
      
      return { error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null };
    }
  },
  
  position: {
    validate: (data) => {
      const errors = [];
      if (!data.userId) errors.push('User ID is required');
      if (!data.crop || data.crop.trim().length === 0) errors.push('Crop is required');
      if (!data.type || !['long', 'short'].includes(data.type)) errors.push('Type must be long or short');
      
      const quantity = parseFloat(data.quantity);
      if (isNaN(quantity) || quantity <= 0) errors.push('Quantity must be a positive number');
      
      const entryPrice = parseFloat(data.entryPrice);
      if (isNaN(entryPrice) || entryPrice <= 0) errors.push('Entry price must be a positive number');
      
      return { error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null };
    }
  },
  
  contract: {
    validate: (data) => {
      const errors = [];
      if (!data.crop || data.crop.trim().length === 0) errors.push('Crop is required');
      
      const quantity = parseFloat(data.quantity);
      if (isNaN(quantity) || quantity <= 0) errors.push('Quantity must be a positive number');
      
      const price = parseFloat(data.price);
      if (isNaN(price) || price <= 0) errors.push('Price must be a positive number');
      
      return { error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null };
    }
  },
  
  priceAlert: {
    validate: (data) => {
      const errors = [];
      if (!data.crop || data.crop.trim().length === 0) errors.push('Crop is required');
      
      const targetPrice = parseFloat(data.targetPrice);
      if (isNaN(targetPrice) || targetPrice <= 0) errors.push('Target price must be a positive number');
      
      if (!data.condition || !['above', 'below'].includes(data.condition)) {
        errors.push('Condition must be above or below');
      }
      
      return { error: errors.length > 0 ? { details: errors.map(e => ({ message: e })) } : null };
    }
  }
};

export default { validateRequest, schemas };
