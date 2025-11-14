# PageRodeo v21 - Fullstack Liveprep

A full-stack web application for website performance monitoring and analysis.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Django 5.2, Django REST Framework, PostgreSQL
- **Monitoring:** PostHog, Centralized Logging, APM
- **Testing:** pytest, Jest, React Testing Library
- **CI/CD:** GitHub Actions

## Project Structure

```
.
├── backend/          # Django backend
├── studio/           # Next.js frontend
├── docs/             # Documentation
└── .github/          # GitHub Actions workflows
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# Set SECRET_KEY, database credentials, etc.

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd studio

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with your configuration
# Set NEXT_PUBLIC_POSTHOG_KEY, etc.

# Run development server
npm run dev
```

## Environment Variables

### Backend (.env)

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=pagerodeo
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# PostHog
POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Testing

### Backend Tests

```bash
cd backend
pytest --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd studio
npm test
npm run test:coverage
```

## Database Backups

### Manual Backup

```bash
cd backend
./scripts/backup-database.sh
```

### Automated Backups

```bash
cd backend
./scripts/setup-backup-cron.sh ./backups daily
```

## Deployment

### Oracle Cloud Infrastructure

**Free Tier Setup:**
- **VM.Standard.A1.Flex** (Always Free-eligible)
  - 1 OCPU, 6GB RAM (sufficient for development and small production)
  - ARM64 architecture (all dependencies compatible)
  - See `docs/Oracle-Cloud-Free-Tier-Setup.md` for free tier deployment

**Quick Start:**
1. See `docs/Oracle-Cloud-Free-Tier-Setup.md` for free tier deployment
2. See `docs/Oracle-Cloud-Quick-Start.md` for step-by-step deployment
3. See `docs/Oracle-Cloud-Deployment.md` for detailed deployment guide
4. Use `scripts/deploy-oracle-cloud.sh` for automated deployment

**Deployment Steps:**
1. Create Oracle Cloud free tier account
2. Create VM.Standard.A1.Flex instance (Always Free)
3. Configure security rules (SSH, HTTP, HTTPS)
4. Connect via SSH
5. Run deployment script: `bash scripts/deploy-oracle-cloud.sh`
6. Configure Nginx: `bash scripts/setup-nginx.sh yourdomain.com`
7. Setup SSL: `bash scripts/setup-ssl.sh yourdomain.com`

### Production Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Set production `ALLOWED_HOSTS` in `.env`
- [ ] Change database password
- [ ] Configure email credentials
- [ ] Set up automated backups
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerting

## Documentation

- [Production Readiness Assessment](docs/Production-Readiness-Assessment.md)
- [Testing Guide](docs/Testing-Guide.md)
- [Database Backup Guide](docs/Database-Backup-Guide.md)
- [Security Implementation Summary](docs/Security-Implementation-Summary.md)

## License

[Your License Here]

## Support

[Your Support Information Here]

