const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load env manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...rest] = line.split('=');
  const val = rest.join('=').trim();
  env[key.trim()] = val;
}

// Generate token for user 1
const token = jwt.sign(
  { userId: 1, email: 'v.munster@weareimpact.nl' },
  env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token:', token.substring(0, 30) + '...');
console.log('OPENROUTER_API_KEY set:', !!env.OPENROUTER_API_KEY);
console.log('OPENROUTER_API_KEY length:', env.OPENROUTER_API_KEY ? env.OPENROUTER_API_KEY.length : 0);

// Test the coach API
async function testCoach() {
  const res = await fetch('http://localhost:3000/api/coach/analyse', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testCoach().catch(console.error);
