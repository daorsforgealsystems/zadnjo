# Contributing to Flow Motion

Thank you for your interest in contributing to the Flow Motion logistics platform! This document provides guidelines and instructions for contributing to the project.

## Development Environment Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ (for some services)
- Docker and Docker Compose (recommended)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flow-motion.git
   cd flow-motion
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your development settings
   ```

3. Install dependencies:
   ```bash
   # Frontend
   npm install
   
   # Backend services (example for one service)
   cd logi-core/services/user-service
   npm install
   ```

4. Start the development servers:
   ```bash
   # Frontend
   npm run dev
   
   # Backend (using Docker Compose)
   docker-compose up
   
   # Or start individual services
   cd logi-core/services/user-service
   npm run dev
   ```

## Project Structure

```
flow-motion/
├── src/                  # Frontend source code
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and services
│   └── assets/           # Static assets
├── public/               # Public assets
├── logi-core/            # Backend monorepo
│   ├── apps/             # Applications (API Gateway, Admin Portal)
│   ├── services/         # Microservices
│   ├── db/               # Database migrations and schemas
│   ├── infra/            # Infrastructure as code
│   └── k8s/              # Kubernetes manifests
├── database/             # Database scripts and migrations
└── scripts/              # Utility scripts
```

## Coding Standards

### General Guidelines

- Follow the existing code style and patterns
- Write clean, readable, and well-documented code
- Keep functions and components small and focused
- Use meaningful variable and function names
- Write tests for new features and bug fixes

### Frontend Guidelines

- Follow React best practices
- Use functional components with hooks
- Organize CSS with Tailwind utility classes
- Keep components reusable and composable
- Use TypeScript for type safety

### Backend Guidelines

- Follow RESTful API design principles
- Implement proper error handling and validation
- Write comprehensive API documentation
- Use dependency injection for testability
- Follow the microservices architecture patterns

## Git Workflow

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. Make your changes and commit them with clear, descriptive messages:
   ```bash
   git commit -m "feat: add new shipment tracking feature"
   # or
   git commit -m "fix: resolve issue with order status updates"
   ```

3. Push your branch to the remote repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request (PR) with a clear description of the changes

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

## Testing

### Frontend Testing

Run frontend tests:
```bash
npm test
```

Write tests using Jest and React Testing Library:
```jsx
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

test('renders component correctly', () => {
  render(<YourComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Backend Testing

Run backend service tests:
```bash
cd logi-core/services/your-service
npm test
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if necessary
3. Add or update tests as needed
4. Make sure all tests pass
5. Request a review from at least one maintainer
6. Address any feedback from reviewers

## Release Process

1. Releases are managed by the core team
2. Version numbers follow [Semantic Versioning](https://semver.org/)
3. Release notes are generated from commit messages

## Documentation

- Update documentation when adding or changing features
- Document APIs using JSDoc or similar conventions
- Keep the README and other documentation up to date

## Community

- Be respectful and inclusive in all interactions
- Help others who have questions
- Provide constructive feedback on issues and pull requests
- Report bugs and issues with detailed information

## License

By contributing to Flow Motion, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions about contributing, please reach out to the maintainers or open an issue for discussion.