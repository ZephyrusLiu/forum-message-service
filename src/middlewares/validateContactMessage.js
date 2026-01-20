const { ValidationError } = require('../utils/customErrors');

const validateContactMessage = (req, res, next) => {
  const { email, subject, message } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Missing email field`);
    throw new ValidationError('Email is required');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email.trim())) {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Invalid email format: ${email}`);
    throw new ValidationError('Please provide a valid email address');
  }

  if (!subject || typeof subject !== 'string') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Missing subject field, Email: ${email}`);
    throw new ValidationError('Subject is required');
  }

  const trimmedSubject = subject.trim();
  if (trimmedSubject === '') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Subject is empty, Email: ${email}`);
    throw new ValidationError('Subject is required');
  }

  if (trimmedSubject.length > 200) {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Subject too long (${trimmedSubject.length} chars), Email: ${email}`);
    throw new ValidationError('Subject cannot exceed 200 characters');
  }

  if (!message || typeof message !== 'string') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Missing message field, Email: ${email}`);
    throw new ValidationError('Message is required');
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage === '') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Message is empty, Email: ${email}`);
    throw new ValidationError('Message is required');
  }

  if (trimmedMessage.length > 5000) {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Message too long (${trimmedMessage.length} chars), Email: ${email}`);
    throw new ValidationError('Message cannot exceed 5000 characters');
  }

  console.log(`[${new Date().toISOString()}] [INFO] Validation passed - Email: ${email}`);
  next();
};

module.exports = validateContactMessage;
