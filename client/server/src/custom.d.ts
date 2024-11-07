// server/src/custom.d.ts
import express from 'express';

// Estendendo a interface Request para incluir userId
declare module 'express-serve-static-core' {
  interface Request {
    userId?: number; // O '?' indica que userId é opcional
  }
}
