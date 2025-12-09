# Contributing to Mijn Ondernemers OS

Bedankt voor je interesse in bijdragen aan Mijn Ondernemers OS! 🧠

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Neon PostgreSQL account (for testing)

### Local Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/mijn-ondernemers-os.git
cd mijn-ondernemers-os

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Fill in your database credentials

# Run database migrations
# Execute schema.sql in your Neon console

# Start development servers
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

## 📝 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing patterns
- **Comments**: Write clear, concise comments in English or Dutch
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for components)

### Git Workflow

1. **Create a branch**
```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-description
```

2. **Make changes**
- Write clean, tested code
- Follow existing patterns
- Keep commits atomic and focused

3. **Commit with Conventional Commits**
```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in auth"
git commit -m "docs: update README"
git commit -m "refactor: simplify utils"
git commit -m "test: add unit tests for button"
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

4. **Push and create PR**
```bash
git push origin feature/my-feature
```

## ✅ Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows existing style patterns
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains what and why

## 🧪 Testing

### Writing Tests

```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

// Hook test example
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './use-my-hook';

describe('useMyHook', () => {
  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('test');
    });

    expect(result.current.value).toBe('test');
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/ui/    # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities & API client
├── types/            # TypeScript types
└── features/         # Feature-specific code (future)
```

### Backend Structure
```
server/
├── middleware/       # Express middleware
├── routes/           # API endpoints
├── schemas/          # Zod validation
└── db/              # Database layer
```

### Key Patterns
- **React Query**: All data fetching
- **Zustand**: Authentication state
- **Zod**: Runtime validation
- **JWT**: Authentication tokens

## 🎨 Design Principles

### Neurodivergent-First
- Clear visual hierarchy
- Reduced cognitive load
- Non-judgmental language
- Structured yet flexible

### Code Quality
- Type safety first (TypeScript strict mode)
- Error handling everywhere
- Validation on all inputs
- Tests for critical paths

## 🐛 Bug Reports

### Good Bug Report Contains:
- **Description**: What happened vs. what should happen
- **Steps to reproduce**: Exact steps to trigger the bug
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable
- **Error messages**: Full error logs

### Example
```markdown
**Bug**: Login fails with valid credentials

**Steps**:
1. Go to login page
2. Enter email: test@example.com
3. Enter password: ValidPass123
4. Click login button

**Expected**: User logs in successfully
**Actual**: Error "Invalid credentials" appears

**Environment**: Chrome 120, Windows 11
**Console errors**: [screenshot]
```

## 💡 Feature Requests

### Good Feature Request Contains:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other solutions considered
- **Use case**: Real-world scenario

## 📚 Documentation

When adding features:
- Update README.md if needed
- Add JSDoc comments to functions
- Update API documentation
- Add examples for complex features

## 🔒 Security

**Never**:
- Commit secrets or credentials
- Push `.env` files
- Hardcode sensitive data
- Skip input validation

**Always**:
- Use parameterized queries
- Validate all inputs
- Sanitize user data
- Report security issues privately

To report security issues: [create private issue]

## 🎯 Focus Areas for Contributors

### High Priority
- [ ] Additional unit tests
- [ ] E2E tests with Playwright
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Medium Priority
- [ ] Additional UI components
- [ ] More coaching content
- [ ] Data visualizations
- [ ] Export/import features

### Future
- [ ] Mobile app (React Native)
- [ ] AI coaching insights
- [ ] Calendar integrations
- [ ] Multi-language support

## 💬 Communication

- **Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **PR Comments**: For code reviews

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Dank je wel voor je bijdrage! 🙏**

Elk beetje hulp maakt dit systeem beter voor hoogbegaafde ondernemers.
