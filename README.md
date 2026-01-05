# Chatbox POC - Twilio & AI Communication Platform

A modern, full-stack communication platform showcasing enterprise-grade Twilio integration and AI-powered messaging capabilities. Built with Laravel 12, React 19, and Inertia.js for seamless real-time communication workflows.

[![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Twilio](https://img.shields.io/badge/Twilio-SDK-F22F46?style=flat&logo=twilio)](https://www.twilio.com)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=flat)](https://inertiajs.com)

## Project Highlights

This proof-of-concept demonstrates expertise in building scalable communication systems that combine:

### Core Features

- **Twilio SDK Integration** - Enterprise-ready messaging infrastructure with SMS/MMS capabilities
- **Contact Management System** - Bulk CSV import with intelligent column mapping and data validation
- **Modern UI/UX** - Responsive design system using shadcn/ui components and Tailwind CSS 4.0
- **Real-time Processing** - Queue-based background job handling for scalability
- **Complete Authentication** - Email verification, password reset, and secure session management
- **Dark Mode Support** - Polished theming system with system preference detection
- **Progressive Enhancement** - Server-side rendering (SSR) with Inertia.js for optimal performance

### Technical Stack

**Backend:**
- Laravel 12 with PHP 8.2+
- Twilio SDK for PHP
- Queue workers for async processing
- Database migrations with SQLite/MySQL support

**Frontend:**
- React 19 with TypeScript
- Inertia.js 2.0 for SPA experience
- Vite 6 for lightning-fast builds
- Radix UI primitives for accessible components
- Tailwind CSS 4.0 with custom configuration

**Developer Experience:**
- PHPUnit & Pest for testing
- ESLint & Prettier for code quality
- Laravel Pint for PHP styling
- Concurrently for multi-process development

### Key Implementation Highlights

#### Contact Management
```tsx
- CSV bulk import with drag & drop support
- Smart column mapping (first name, last name, phone, email)
- Real-time contact filtering and search
- Validation and duplicate detection
```

#### Twilio Integration
```php
- SMS/MMS message delivery
- Webhook handling for message status
- Phone number validation
- Scalable messaging queue
```

#### Modern Architecture
```
- Type-safe React components
- Server-side rendering (SSR)
- Component-driven UI with shadcn/ui
- RESTful API design patterns
```

## Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ & npm
- MySQL/SQLite database
- Twilio account (optional for full features)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/chatbox-poc.git
cd chatbox-poc

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Create database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Build assets
npm run build
```

### Development Server

```bash
# Run all services concurrently (recommended)
composer dev

# Or run services individually:
php artisan serve          # Laravel server
php artisan queue:listen   # Queue worker
npm run dev               # Vite dev server
```

### With SSR (Server-Side Rendering)

```bash
composer dev:ssr
```

This runs:
- Laravel development server
- Queue listener
- Laravel Pail (logs)
- Inertia.js SSR server

## Configuration

### Twilio Setup

Add your Twilio credentials to `.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Database Configuration

The project uses SQLite by default. For MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chatbox_poc
DB_USERNAME=root
DB_PASSWORD=
```

### Queue Configuration

```env
QUEUE_CONNECTION=database
```

## Testing

```bash
# Run PHP tests
composer test

# Run with coverage
php artisan test --coverage

# Type checking
npm run types

# Linting
npm run lint
npm run format:check
```

## Project Structure

```
├── app/
│   ├── Http/Controllers/    # Route controllers
│   ├── Models/              # Eloquent models
│   └── Providers/           # Service providers
├── resources/
│   ├── js/
│   │   ├── components/      # React components
│   │   ├── layouts/         # Page layouts
│   │   ├── pages/           # Inertia pages
│   │   └── types/           # TypeScript definitions
│   └── css/                 # Stylesheets
├── routes/                  # Application routes
├── database/
│   ├── migrations/          # Database migrations
│   └── seeders/             # Data seeders
└── tests/                   # PHPUnit/Pest tests
```

## UI Components

This project uses a custom implementation of **shadcn/ui** components including:

- Avatar, Button, Card, Dialog
- Dropdown Menu, Input, Label, Select
- Sidebar, Tooltip, Toggle
- And more...

All components are:
- Fully accessible (ARIA compliant)
- TypeScript typed
- Dark mode compatible
- Customizable via Tailwind

## Deployment

### Production Build

```bash
# Build frontend assets
npm run build:ssr

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force
```

### Environment Setup

Ensure production environment variables are set:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
```

## Use Cases

This architecture is ideal for:

- **Customer Support Systems** - Multi-channel communication with SMS integration
- **Marketing Automation** - Bulk messaging campaigns with contact management
- **Notification Services** - Transactional alerts and reminders via Twilio
- **CRM Platforms** - Contact database with communication history
- **AI Chatbots** - Integration-ready for AI/LLM message processing

## Security Features

- CSRF protection on all forms
- SQL injection prevention via Eloquent ORM
- XSS protection with React
- Secure password hashing (bcrypt)
- Email verification system
- Rate limiting on authentication endpoints

## Code Quality

- **Type Safety**: Full TypeScript coverage on frontend
- **Testing**: Comprehensive test suite with Pest
- **Linting**: ESLint + Prettier for consistent code style
- **Standards**: PSR-12 PHP coding standards via Laravel Pint

## Key Technologies

- [Laravel 12](https://laravel.com) - PHP framework
- [React 19](https://react.dev) - UI library
- [Inertia.js](https://inertiajs.com) - Modern monolith framework
- [Twilio SDK](https://www.twilio.com/docs/libraries/php) - Communication APIs
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Vite](https://vitejs.dev) - Frontend tooling
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Radix UI](https://www.radix-ui.com/) - Headless components

## About the Developer

Built by a **Twilio & AI consultant** specializing in:
- Communication platform integration (SMS, Voice, Video)
- AI/LLM integration for intelligent messaging
- Real-time systems and WebSocket communication
- Scalable full-stack architecture
- Modern TypeScript/React development

### Consulting Services

Available for:
- Twilio API integration and optimization
- AI-powered communication workflows
- Full-stack application development
- Technical architecture consulting
- Code review and best practices

---

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Acknowledgments

- Laravel team for the excellent framework
- Twilio for robust communication APIs
- shadcn for the beautiful UI components
- The open-source community

---

**If you find this project valuable, please consider starring it on GitHub!**

*Need a Twilio or AI integration expert? [Let's connect!](https://ggomez.dev/#contact)*
