# Deployment Steps

## Step 1: Deploy to GitHub

### Option A: Use the deployment script (Recommended)

```powershell
# Run the deployment script
.\deploy-to-github.ps1
```

### Option B: Manual deployment

```powershell
# 1. Check status
git status --short

# 2. Verify .env files are ignored (should return nothing)
git status | Select-String ".env"

# 3. Add all files
git add .

# 4. Commit changes
git commit -m "Fix: TypeScript errors resolved - All 66 errors fixed

- Fixed ErrorCategory enum mismatches in error-handler.ts
- Created type declarations for vaul, dom-to-image-more, dns-packet
- Fixed implicit any types in hooks and components
- Fixed toast() calls to use correct sonner format
- Fixed OrchestratorState missing properties
- Fixed API route type issues (both app/api and public/api)
- Fixed monitorId redeclaration in uptime-kuma route
- Fixed typography route weights type issues
- All TypeScript errors resolved (0 errors)
- Build successful"

# 5. Push to GitHub
git push origin main
```

### Verify deployment

1. Go to: https://github.com/fxepro/pagerodeofullstack
2. Verify all files are present
3. Verify `.env` files are NOT included

---

## Step 2: Deploy to Oracle Cloud VM

### Prerequisites

1. ✅ Oracle Cloud VM instance created
2. ✅ SSH access configured
3. ✅ Security rules configured (SSH, HTTP, HTTPS)
4. ✅ PostgreSQL 14+ installed
5. ✅ Python 3.11+ installed
6. ✅ Node.js 20+ installed
7. ✅ Nginx installed

### Option A: Use the deployment script (Recommended)

```bash
# 1. Copy the deployment script to your Oracle VM
# From your local machine, copy the script:
scp deploy-to-oracle-vm.sh opc@<your-oracle-ip>:/home/opc/

# 2. SSH into your Oracle VM
ssh opc@<your-oracle-ip>

# 3. Make the script executable
chmod +x deploy-to-oracle-vm.sh

# 4. Run the deployment script
./deploy-to-oracle-vm.sh
```

### Option B: Manual deployment

```bash
# 1. SSH into your Oracle VM
ssh opc@<your-oracle-ip>

# 2. Update system
sudo yum update -y

# 3. Clone or pull repository
cd /opt
if [ -d "pagerodeo" ]; then
    cd pagerodeo
    git pull origin main
else
    sudo git clone https://github.com/fxepro/pagerodeofullstack.git pagerodeo
    sudo chown -R opc:opc pagerodeo
    cd pagerodeo
fi

# 4. Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 5. Create/update .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    nano .env  # Edit with production values
fi

# 6. Run migrations
python manage.py migrate

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Frontend setup
cd ../studio
npm install

# 9. Create/update .env.local file
if [ ! -f ".env.local" ]; then
    cp env.example .env.local
    nano .env.local  # Edit with production values
fi

# 10. Build production bundle
npm run build

# 11. Restart services
sudo systemctl restart pagerodeo-backend
sudo systemctl restart pagerodeo-frontend
sudo systemctl restart nginx

# 12. Check service status
sudo systemctl status pagerodeo-backend
sudo systemctl status pagerodeo-frontend
sudo systemctl status nginx
```

### Verify deployment

```bash
# 1. Check service status
sudo systemctl status pagerodeo-backend pagerodeo-frontend nginx

# 2. Check logs
sudo journalctl -u pagerodeo-backend -f
sudo journalctl -u pagerodeo-frontend -f

# 3. Test backend API
curl http://localhost:8000/api/health/

# 4. Test frontend
curl http://localhost:3000

# 5. Test via public IP
curl http://<your-oracle-ip>
```

---

## Troubleshooting

### GitHub Deployment Issues

1. **Authentication failed**
   - Check your GitHub credentials
   - Use personal access token if needed
   - Verify remote URL: `git remote -v`

2. **Large files**
   - Check `.gitignore` is working
   - Verify no large files are being committed

### Oracle VM Deployment Issues

1. **Services not starting**
   - Check service files: `/etc/systemd/system/pagerodeo-backend.service`
   - Check logs: `sudo journalctl -u pagerodeo-backend -n 50`
   - Verify Python/Node.js paths

2. **Database connection failed**
   - Check PostgreSQL is running: `sudo systemctl status postgresql-14`
   - Verify `.env` file has correct database credentials
   - Test connection: `psql -U pagerodeo_user -d pagerodeo`

3. **Build errors**
   - Check Node.js version: `node --version` (should be 20+)
   - Clear cache: `rm -rf node_modules .next`
   - Reinstall: `npm install`

4. **Nginx not serving**
   - Check Nginx config: `sudo nginx -t`
   - Check Nginx status: `sudo systemctl status nginx`
   - Verify ports 80/443 are open in security rules

---

## Quick Reference

### Useful Commands

```bash
# View backend logs
sudo journalctl -u pagerodeo-backend -f

# View frontend logs
sudo journalctl -u pagerodeo-frontend -f

# Restart services
sudo systemctl restart pagerodeo-backend pagerodeo-frontend nginx

# Check service status
sudo systemctl status pagerodeo-backend pagerodeo-frontend nginx

# Test API
curl http://localhost:8000/api/health/

# Test frontend
curl http://localhost:3000

# Check PostgreSQL
sudo systemctl status postgresql-14
sudo -u postgres psql -c "SELECT version();"

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Environment Variables

**Backend (.env):**
- `SECRET_KEY` - Django secret key
- `DEBUG=False` - Production mode
- `ALLOWED_HOSTS` - Your domain/IP
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `POSTHOG_API_KEY` - PostHog API key

**Frontend (.env.local):**
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog public key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host
- `NEXT_PUBLIC_APP_URL` - Your app URL

---

## Next Steps After Deployment

1. ✅ Verify all services are running
2. ✅ Test API endpoints
3. ✅ Test frontend pages
4. ✅ Configure SSL certificate (Let's Encrypt)
5. ✅ Setup automated backups
6. ✅ Monitor logs and errors
7. ✅ Setup domain name (if applicable)

---

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u <service-name> -f`
2. Check documentation: `docs/Oracle-Cloud-Deployment.md`
3. Verify environment variables
4. Check service status

