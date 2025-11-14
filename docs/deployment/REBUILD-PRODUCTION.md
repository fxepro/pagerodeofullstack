# Rebuild Production Frontend

If the production site is serving old pages/components, the frontend needs to be rebuilt.

## Quick Fix

**On the server, run these commands:**

```bash
cd /opt/pagerodeofullstack

# Pull latest changes
git pull

# Rebuild frontend (this takes 1-5 minutes but old site still runs)
cd studio
npm install
npm run build

# Restart frontend service (only ~5-10 seconds downtime)
sudo systemctl restart pagerodeo-frontend

# Verify it's running
sudo systemctl status pagerodeo-frontend --no-pager

# Test the site
curl http://localhost/
```

## Step-by-Step

**1. Pull latest code:**
```bash
cd /opt/pagerodeofullstack
git pull
```

**2. Rebuild frontend:**
```bash
cd studio
npm install
npm run build
```

**3. Restart service:**
```bash
sudo systemctl restart pagerodeo-frontend
```

**4. Verify:**
```bash
sudo systemctl status pagerodeo-frontend --no-pager
curl -I http://localhost/
```

## Common Issues

### Build fails

Check logs:
```bash
cd /opt/pagerodeofullstack/studio
npm run build
```

### Service won't start

Check logs:
```bash
sudo journalctl -u pagerodeo-frontend -n 50 --no-pager
```

### Still seeing old content

Clear Next.js cache:
```bash
cd /opt/pagerodeofullstack/studio
rm -rf .next
npm run build
sudo systemctl restart pagerodeo-frontend
```

## Notes

- The old site continues running during the build
- Downtime is only during service restart (~5-10 seconds)
- Always rebuild after pulling frontend changes
- Clear `.next` cache if you suspect caching issues

