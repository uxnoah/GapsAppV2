# Contributing to Chapp

Thank you for your interest in contributing to Chapp! This document provides guidelines and information for contributors.

IMPORTANT NOTE: This document is fully AI created and has not been human ratified. 

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/yourusername/Chapp.git`
3. **Set up the development environment**: Run `./scripts/setup.sh`
4. **Create a feature branch**: `git checkout -b feature/your-feature-name`

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features

### Testing
- Run tests before submitting: `npm test`
- Add tests for new functionality
- Ensure all tests pass before creating a pull request

### Git Workflow
1. Make your changes in a feature branch
2. Commit with descriptive messages
3. Push to your fork
4. Create a pull request

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(api): add user authentication endpoint
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

## 🐛 Reporting Issues

When reporting bugs, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## 💡 Feature Requests

For feature requests:
- Describe the feature clearly
- Explain the use case
- Consider implementation complexity
- Check if it aligns with project goals

## 🔧 Development Setup

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Git

### Local Development
1. Run `./scripts/setup.sh` for initial setup
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Check linting: `npm run lint`

### Database Development
- Use SQLite for local development
- Run migrations: `npx prisma migrate dev`
- Generate client: `npx prisma generate`
- View database: `npx prisma studio`

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** if applicable
5. **Create pull request** with clear description
6. **Wait for review** and address feedback

## 🏗️ Project Structure

```
src/
├── app/           # Next.js app directory
├── components/    # React components
└── lib/          # Utility functions and types
```

## 🧪 Testing

- **Unit tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage**: Add `--coverage` flag to test command

## 📚 Documentation

- Keep README.md updated
- Document new API endpoints
- Update type definitions
- Add inline comments for complex logic

## 🤝 Code Review

All contributions require review:
- Be respectful and constructive
- Focus on code quality and functionality
- Provide specific, actionable feedback
- Test changes locally before approving

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🆘 Need Help?

- Check existing issues and discussions
- Ask questions in issues or discussions
- Review documentation and code comments

Thank you for contributing to Chapp! 🎉 