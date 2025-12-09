# 🚀 Migration Guide: Naar Wereldklasse

Deze guide helpt je om je bestaande app te migreren naar de nieuwe wereldklasse architectuur.

## ⚠️ KRITIEK: Voor je begint

### 1. Backup je database
```sql
-- Maak een backup via Neon console
-- Of export je data:
SELECT * FROM users;
SELECT * FROM habits;
SELECT * FROM goals;
-- etc.
```

### 2. Git commit je huidige state
```bash
git add -A
git commit -m "chore: backup before migration"
```

## 📦 Wat is er veranderd?

### Backend Transformatie
```
OLD: server.js (211 regels monoliet)
NEW: server/ (gestructureerde TypeScript modules)
  ├── index.ts (main server)
  ├── middleware/ (auth, error, validation, logging)
  ├── routes/ (gescheiden per resource)
  ├── schemas/ (Zod validation)
  └── db/ (database types)
```

### Frontend Transformatie
```
OLD: src/App.jsx (760 regels monoliet)
NEW: src/ (modulaire TypeScript structuur)
  ├── components/ui/ (herbruikbare componenten)
  ├── hooks/ (custom hooks met React Query)
  ├── lib/ (API client, utils, config)
  └── types/ (TypeScript definities)
```

### Nieuwe Features
✅ TypeScript (full type safety)
✅ JWT Authentication (veilig)
✅ Zod Validation (runtime checks)
✅ React Query (data management)
✅ Error Boundaries
✅ Testing Infrastructure
✅ CI/CD Pipeline
✅ Docker Support
✅ PWA Capabilities
✅ Rate Limiting
✅ Security Headers

## 🔧 Migratie Stappen

### Stap 1: Dependencies Updaten
```bash
# Alle nieuwe packages zijn al geïnstalleerd!
npm install
```

### Stap 2: Environment Variables
```bash
# De nieuwe .env bevat al alles
# Check of JWT_SECRET sterk genoeg is:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update JWT_SECRET in .env indien nodig
```

### Stap 3: Database Schema Check
```bash
# Je huidige schema zou moeten blijven werken
# Check of alle tabellen bestaan:
# - users
# - habits
# - daily_logs
# - goals
# - weekly_reviews
# - focus_sessions
```

### Stap 4: Test de Nieuwe Backend
```bash
# Start de nieuwe TypeScript server
npm run server

# Test endpoints:
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# Test auth (registreer een test user):
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### Stap 5: Frontend Aanpassen

#### Je moet GEEN volledig nieuwe frontend schrijven!
Je kunt stapsgewijs migreren:

**Optie A: Behoud oude App.jsx (werkt nog steeds)**
```jsx
// src/App.jsx blijft werken!
// Maar update API calls naar nieuwe endpoints met Bearer tokens
```

**Optie B: Gebruik nieuwe hooks (aanbevolen)**
```tsx
// Voorbeeld: Gebruik nieuwe useAuth hook
import { useAuth } from '@/hooks/use-auth';

function App() {
  const { user, login, logout } = useAuth();

  // Rest van je code...
}
```

**Optie C: Volledig nieuwe TypeScript App (toekomst)**
```tsx
// Bouw stapsgewijs nieuwe componenten
// Gebruik de nieuwe structure in /components, /features
```

### Stap 6: Tests Runnen
```bash
# Run alle tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint
```

## 🔄 API Wijzigingen

### Oude vs Nieuwe Endpoints

#### Auth
```javascript
// OLD
POST /api/register
Response: { user: { id, email } }

// NEW
POST /api/auth/register
Response: { user: { id, email, createdAt }, token: "jwt..." }
```

#### Protected Endpoints
```javascript
// OLD
GET /api/habits/123  // User ID in URL

// NEW
GET /api/habits      // Auth via Bearer token
Headers: { "Authorization": "Bearer <token>" }
```

### Frontend API Client Update

```typescript
// OLD way (in App.jsx)
fetch(`${API_BASE}/habits/${userId}`)

// NEW way (gebruik lib/api.ts)
import { api } from '@/lib/api';
const habits = await api.habits.getAll();  // Auth automatic!
```

## 📱 Frontend Migration Strategieën

### Minimale Migratie (Quick Start)
1. Behoud je huidige `App.jsx`
2. Update alleen de API calls om JWT tokens te gebruiken
3. Add Authorization header bij elke request

```javascript
// In je bestaande App.jsx
const token = localStorage.getItem('token');
fetch(`${API_BASE}/habits`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Progressieve Migratie (Aanbevolen)
1. Start met nieuwe auth flow (`useAuth` hook)
2. Vervang data fetching met React Query hooks
3. Refactor componenten één voor één
4. Gebruik nieuwe UI componenten waar mogelijk

```tsx
// Stap voor stap migreren
import { useAuth } from '@/hooks/use-auth';
import { useHabits } from '@/hooks/use-habits';

function DashboardModern() {
  const { user } = useAuth();
  const { data: habits, isLoading } = useHabits();

  // Je oude component logic...
}
```

### Volledige Rewrite (Toekomst)
- Gebruik de nieuwe folder structuur volledig
- TypeScript overal
- Feature-based architecture in `/features`
- Alle componenten in `/components`

## 🐛 Troubleshooting

### "401 Unauthorized"
```javascript
// Zorg dat token in localStorage staat
const token = localStorage.getItem('token');
if (!token) {
  // Redirect naar login
}
```

### "CORS Error"
```bash
# Check of FRONTEND_URL correct is in .env
FRONTEND_URL=http://localhost:5173
```

### "Module not found"
```bash
# TypeScript path aliases werken nu
# Gebruik @ voor imports:
import { Button } from '@/components/ui/button';
```

### "Database connection failed"
```bash
# Check DATABASE_URL in .env
# Check of Neon database bereikbaar is
psql "postgresql://..." -c "SELECT 1"
```

## 🎯 Volgende Stappen

### Korte Termijn (Nu)
1. ✅ Backend draait met nieuwe server
2. ✅ JWT auth werkt
3. ✅ API endpoints beschikbaar
4. [ ] Frontend updated voor JWT tokens
5. [ ] Eerste user kan inloggen

### Middellange Termijn (Deze Week)
1. [ ] Oude App.jsx migreren naar nieuwe hooks
2. [ ] Tests schrijven voor je features
3. [ ] Error handling verbeteren
4. [ ] Data export feature toevoegen

### Lange Termijn (Deze Maand)
1. [ ] Volledig TypeScript frontend
2. [ ] PWA installeren en testen
3. [ ] Production deployment
4. [ ] Monitoring setup

## 📚 Resources

- **Nieuwe API Docs**: zie README.md
- **Component Voorbeelden**: zie `src/components/ui/__tests__`
- **Hook Voorbeelden**: zie `src/hooks/__tests__`
- **TypeScript Types**: zie `src/types/index.ts`

## 💡 Tips

1. **Start klein**: Migreer eerst alleen auth
2. **Test continu**: Run tests na elke wijziging
3. **Gebruik types**: TypeScript helpt bugs voorkomen
4. **Read the docs**: Nieuwe READMEs bevatten alles
5. **Ask for help**: Open een issue als je vast loopt

## 🆘 Rollback Plan

Als iets misgaat:

```bash
# Rollback git
git reset --hard HEAD~1

# Of checkout specific file
git checkout HEAD~1 -- server.js

# Oude server starten
node server.js
```

---

**Succes met de migratie! 🚀**

Je app is nu gebouwd volgens wereldklasse standaarden.
