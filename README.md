# Chapp - GAPS Diagram Application

A modern web application for creating and managing GAPS (Goals, Analysis, Plans, Status) diagrams. Built with Next.js, TypeScript, Prisma, and TailwindCSS.

## 🚀 Planned Features

- **Interactive GAPS Diagrams**: Create and manage goal-oriented diagrams
- **Real-time Collaboration**: Work with others on shared boards
- **AI Integration**: Built-in AI assistance for diagram creation and analysis
- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **Type Safety**: Full TypeScript support throughout the application
- **Database Management**: Prisma ORM with SQLite for development, PostgreSQL ready for production

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Chapp
```

### 2. Quick Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup.sh
```

This script will:
- Check Node.js version requirements
- Install dependencies
- Create environment file from template
- Generate Prisma client
- Set up database
- Run tests to verify setup

### 3. Manual Setup (Alternative)

If you prefer manual setup:

#### Install Dependencies
```bash
npm install
# or
yarn install
```

#### Environment Configuration
Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
# Database Configuration
DATABASE_URL="file:./prisma/database.db"

# Node Environment
NODE_ENV="development"
```

#### Database Setup
Initialize and set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
Chapp/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── gaps-canvas.tsx # Main GAPS diagram component
│   │   ├── gaps-box.tsx    # Individual GAPS box component
│   │   └── gaps-item.tsx   # Individual thought/item component
│   └── lib/               # Utility libraries
│       ├── database.ts    # Database operations
│       ├── types.ts       # TypeScript type definitions
│       └── utils.ts       # Utility functions
├── prisma/                # Database schema and migrations
│   └── schema.prisma      # Prisma schema definition
├── config/               # Configuration files
│   ├── jest.config.js    # Jest testing configuration
│   └── tailwind.config.js # TailwindCSS configuration
└── scripts/              # Utility scripts
```

## 🗄️ Database Schema

The application uses Prisma with the following main models:

- **User**: Authentication and user profiles
- **Board**: GAPS diagrams and their metadata
- **Thought**: Individual items within GAPS sections
- **WorkSession**: Working sessions and progress tracking
- **Conversation**: AI chat conversations
- **ActivityLog**: User activity tracking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Jest** for testing

## 🚀 Deployment

### Local Development
The application is configured for local development with SQLite database.

### Production Deployment
For production deployment, you'll need to:

1. **Database**: Set up a PostgreSQL or MySQL database
2. **Environment Variables**: Configure production environment variables
3. **Build**: Run `npm run build` to create production build
4. **Deploy**: Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

Example production environment variables:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV="production"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/Chapp/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## 🔮 Roadmap

- [ ] AI-powered diagram suggestions
- [ ] Real-time collaboration features
- [ ] Advanced export options (PDF, PNG)
- [ ] Mobile app development
- [ ] Integration with external tools
- [ ] Advanced analytics and insights

---

**Note**: This is a development version. Some features may be in progress or experimental. 