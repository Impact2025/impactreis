# Mastermind Editie - Voortgang & Vervolgstappen

**Laatst bijgewerkt:** 9 december 2025
**Status:** Sprint 1 ✅ COMPLEET | Sprint 2 🔜 VOLGENDE

---

## 📋 Overzicht

Dit document houdt de voortgang bij van de Mastermind Editie upgrade voor de Ondernemers Assistent app. Het complete implementatieplan staat in: `C:\Users\Vincent\.claude\plans\radiant-cooking-jellyfish.md`

### Gekozen Aanpak
- **Fase 1**: Core features (Design system, Wall of Wins, Quantum Leap Coach, Bibliotheek)
- **AI Complexity**: Slimme versie (context-aware coach)
- **Prioriteiten**:
  1. Wall of Wins
  2. Enhanced Morning Routine
  3. Quantum Leap Coach
  4. Bibliotheek/Wisdom Engine

---

## ✅ Sprint 1: Foundation - COMPLEET

### 1. Design System Upgrade
**Bestand:** `tailwind.config.js`

**Toegevoegd:**
```javascript
colors: {
  gold: { 50-900 palette }  // Voor Wall of Wins
},
borderRadius: {
  'bento': '2rem',
  'bento-lg': '2.5rem',
},
boxShadow: {
  'soft': '0 2px 20px -2px rgba(0, 0, 0, 0.05)',
  'soft-lg': '0 4px 30px -4px rgba(0, 0, 0, 0.08)',
}
```

### 2. UI Components

**Nieuwe component:** `src/components/ui/bento-grid.tsx`
- `<BentoGrid>` - Flexibel grid systeem (1-4 kolommen)
- `<BentoGridItem>` - Individuele card met col/row spanning
- Variants: default, wisdom, growth, energy
- Responsive & hover effects

**Updated component:** `src/components/ui/widget.tsx`
- Nieuwe props: `variant` en `gradient`
- 4 variants met eigen kleurenschema's
- Gradient mode voor impactvolle cards

### 3. Database Schema

**Nieuwe tabellen in database (aangemaakt ✅):**

```sql
-- Wins table (Wall of Wins)
CREATE TABLE wins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- business/personal/health/learning
  impact_level INTEGER DEFAULT 1,  -- 1-5
  date DATE NOT NULL,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Context table (Quantum Leap Coach)
CREATE TABLE user_context (
  user_id TEXT PRIMARY KEY,
  current_energy_level INTEGER DEFAULT 5,
  current_stress_level INTEGER DEFAULT 5,
  recent_mood TEXT DEFAULT 'neutral',
  last_major_win_date DATE,
  current_focus_area TEXT,
  coaching_style TEXT DEFAULT 'balanced',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_wins_user_id` - Voor snelle user queries
- `idx_wins_date` - Voor timeline sorting

**Script gebruikt:** `create-wins-tables.js` ✅

### 4. API Routes

**Nieuwe endpoints:**

#### `src/app/api/wins/route.ts`
- `GET /api/wins` - Fetch all wins met filters:
  - `?category=business|personal|health|learning`
  - `?startDate=YYYY-MM-DD`
  - `?endDate=YYYY-MM-DD`
  - `?impactLevel=1-5`
  - `?search=keyword`
- `POST /api/wins` - Create new win
  - Body: `{ title, description, category, impactLevel, date, tags }`
  - Auto-updates `user_context.last_major_win_date` if impact >= 4

#### `src/app/api/wins/[id]/route.ts`
- `GET /api/wins/[id]` - Fetch specific win
- `PUT /api/wins/[id]` - Update win
- `DELETE /api/wins/[id]` - Delete win

---

## 🔜 Sprint 2: Wall of Wins UI - VOLGENDE STAP

### Te bouwen components:

#### 1. Win Card Component
**Nieuw bestand:** `src/components/wins/win-card.tsx`

```typescript
interface WinCardProps {
  win: {
    id: number;
    title: string;
    description?: string;
    category: 'business' | 'personal' | 'health' | 'learning';
    impactLevel: 1 | 2 | 3 | 4 | 5;
    date: string;
    tags?: string[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**Features:**
- Category-based gradient colors
- Impact level badges (1-5 stars/badges)
- Hover effects (edit/delete buttons)
- Tags als chips
- Relative date display ("2 weken geleden")

**Kleuren per category:**
- business: Emerald/Teal gradient
- personal: Amber/Gold gradient
- health: Rose/Pink gradient
- learning: Indigo/Violet gradient

#### 2. Add Win Modal
**Nieuw bestand:** `src/components/wins/add-win-modal.tsx`

**Form fields:**
- Title (text input, required)
- Description (textarea, optional)
- Category (select dropdown, required)
- Impact Level (1-5 star selector, required)
- Date (date picker, default=today, required)
- Tags (multi-input chips, optional)

**Validatie:**
- Title: min 3 chars
- Category: enum check
- Impact: 1-5 range
- Date: valid ISO date

#### 3. Wins Page (Timeline View)
**Nieuw bestand:** `src/app/wins/page.tsx`

**Layout:**
```
+----------------------------------+
| Header met filters               |
+----------------------------------+
| Zoekbalk | Category filters      |
+----------------------------------+
| Timeline (verticaal)             |
|   December 2025                  |
|   ├─ Win Card                   |
|   ├─ Win Card                   |
|   November 2025                  |
|   ├─ Win Card                   |
|   └─ ...                        |
+----------------------------------+
| Floating Add Button (FAB)        |
+----------------------------------+
```

**Features:**
- Vertical timeline met maand headers
- Category filter buttons (all/business/personal/health/learning)
- Search bar (titel + description)
- Infinite scroll of pagination
- FAB (Floating Action Button) rechtsonder voor "Add Win"
- Empty state: motiverende boodschap + call-to-action

#### 4. Dashboard Integration
**Update bestand:** `src/app/dashboard/page.tsx`

**Toevoegen:**
- Recent Wins widget (laatste 3-5 wins)
- "Bekijk alle wins" link naar `/wins` page
- Win count badge

**Plaats in dashboard:**
- Onder de Quick Stats
- Boven of naast Daily Rituals

---

## 🎨 Design Guidelines

### Color Mapping
- **Wisdom** (Indigo/Violet): Doelen, Visie, Learning
- **Growth** (Emerald/Teal): Business, Finance, Success
- **Energy** (Amber/Gold): Personal, Achievements, Wins
- **Health** (Rose/Pink): Health, Wellness

### Typography
- Headers: font-bold
- Body: font-normal
- Accent: font-semibold

### Spacing
- Card padding: p-6
- Gap between items: gap-6
- Section margins: mb-8

### Animations
- Hover: `hover:shadow-soft-lg hover:-translate-y-0.5`
- Transition: `transition-all duration-300 ease-out`
- Timeline dots: animate on scroll

---

## 📝 Code Snippets voor Sprint 2

### API Client toevoegen aan `src/lib/api.ts`

```typescript
// Add to api.ts
wins = {
  getAll: (params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    impactLevel?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const queryString = queryParams.toString();
    return this.request<Win[]>(
      `/wins${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: (id: number) =>
    this.request<Win>(`/wins/${id}`),

  create: (data: CreateWinData) =>
    this.request<Win>('/wins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateWinData>) =>
    this.request<Win>(`/wins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    this.request<{ message: string }>(`/wins/${id}`, {
      method: 'DELETE',
    }),
};
```

### Types toevoegen aan `src/types/index.ts`

```typescript
export interface Win {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  category: 'business' | 'personal' | 'health' | 'learning';
  impact_level: 1 | 2 | 3 | 4 | 5;
  date: string;
  tags?: string[];
  created_at: string;
}

export interface CreateWinData {
  title: string;
  description?: string;
  category: 'business' | 'personal' | 'health' | 'learning';
  impactLevel: 1 | 2 | 3 | 4 | 5;
  date: string;
  tags?: string[];
}
```

---

## 🔧 Technische Notities

### State Management voor Wins
- Local state met `useState` voor form
- API calls via custom hooks (optioneel):
  ```typescript
  const useWins = () => {
    const [wins, setWins] = useState<Win[]>([]);
    const [loading, setLoading] = useState(false);
    // ... fetch logic
  };
  ```

### LocalStorage Backup
Optie om wins te cachen in localStorage voor offline-first:
```typescript
localStorage.setItem('wins_cache', JSON.stringify(wins));
```

### Date Formatting
Voor "2 weken geleden":
```typescript
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

formatDistanceToNow(new Date(win.date), {
  addSuffix: true,
  locale: nl
});
```

---

## 🚦 Volgende Sessie Checklist

Wanneer je verder gaat met Sprint 2:

1. ✅ Database is klaar (wins & user_context tables)
2. ✅ API routes zijn gebouwd en getest
3. ⏭️ **Start met:** Win Card Component (`src/components/wins/win-card.tsx`)
4. ⏭️ **Dan:** Add Win Modal (`src/components/wins/add-win-modal.tsx`)
5. ⏭️ **Dan:** Wins Page (`src/app/wins/page.tsx`)
6. ⏭️ **Dan:** Dashboard integration

### Quick Start Command:
```bash
# Server draaien (indien nog niet actief)
cd D:\impactreis3\mijn-ondernemers-os
PORT=3005 node server.js &

# Of via npm (als configured)
npm run dev
```

---

## 📚 Referenties

- **Complete Plan:** `C:\Users\Vincent\.claude\plans\radiant-cooking-jellyfish.md`
- **Database Schema:** `schema.sql`
- **API Documentatie:** `API_ROUTES.md`
- **Design Philosophy:** Zie hoofdstuk "De Kernfilosofie" in je originele blueprint

---

## 💡 Tips voor Volgende Sessie

1. **Test de API routes eerst** met een tool zoals Postman of via browser console
2. **Begin met de Win Card** - dit is de basis building block
3. **Gebruik de Bento Grid** voor layout consistency
4. **Denk aan mobile-first** - timeline moet goed werken op telefoon
5. **Voeg placeholder data toe** tijdens development voor realistic testing

---

## ✨ Vision Statement

> "De Wall of Wins is meer dan een feature - het is jouw persoonlijke Cookie Jar. Wanneer het moeilijk wordt, scroll je door je successen en herinner je jezelf: 'Ik heb dit gedaan. Ik kan meer.'"
>
> — David Goggins filosofie, geïntegreerd in Mastermind Editie

---

**Succes met de volgende sprint! 🚀**
