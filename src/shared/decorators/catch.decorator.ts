import { NextFunction } from 'express';

// wrapper for try catch
export function Catch() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const next = args[2] as NextFunction;
      try {
        await originalMethod.apply(this, args);
      } catch (error) {
        if (next) {
          next(error);
        } else {
          console.error(`[Error in ${propertyKey}]:`, error);
          throw error;
        }
      }
    };

    return descriptor;
  };
}
