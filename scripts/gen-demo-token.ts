import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { sign } from 'jsonwebtoken';

// Lees .env.local direct om JWT_SECRET te krijgen (tsx --eval laadt het niet altijd)
const envLocal = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const match = envLocal.match(/^JWT_SECRET=(.+)$/m);
if (!match) throw new Error('JWT_SECRET niet gevonden in .env.local');
const secret = match[1];

const token = sign({ userId: 19, email: 'demo@impactreis.nl' }, secret, { expiresIn: '7d' });
console.log(token);
