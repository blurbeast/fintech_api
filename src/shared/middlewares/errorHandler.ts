import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err.message);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.issues,
    });
  }

  // express.json() JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (err.message === 'User with this email already exists') {
    return res.status(409).json({ error: err.message });
  }

  if (err.message === 'Invalid email or password') {
    return res.status(401).json({ error: err.message });
  }

  if (err.message === 'Wallet not found' || err.message === 'Recipient not found' || err.message === 'Recipient wallet not found' || err.message === 'User not found' || err.message === 'Sender wallet not found') {
    return res.status(404).json({ error: err.message });
  }

  if (err.message === 'Insufficient balance' || err.message === 'Amount must be greater than 0' || err.message === 'Cannot transfer to yourself') {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal Server Error' });
};
