# Monitoring App - Celery Setup

This app uses Celery for background monitoring tasks.

## Setup

### 1. Install Dependencies

```bash
pip install celery redis
```

Or install from requirements.txt:
```bash
pip install -r requirements.txt
```

### 2. Start Redis

Celery requires Redis as a message broker. Make sure Redis is running:

**Windows:**
- Download Redis from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `wsl redis-server`

**Linux/Mac:**
```bash
redis-server
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

### 3. Configure Environment Variables

Add to your `.env` file (optional, defaults shown):
```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 4. Run Celery Worker

In a separate terminal, start the Celery worker:

**Windows:**
```bash
cd backend
celery -A core worker --loglevel=info --pool=solo
```

**Linux/Mac:**
```bash
cd backend
celery -A core worker --loglevel=info
```

**Note:** On Windows, the `--pool=solo` flag is required because multiprocessing doesn't work well on Windows. The settings file automatically configures this, but you can also specify it manually.

### 5. Run Celery Beat (Scheduler)

In another separate terminal, start Celery Beat for periodic tasks:

```bash
cd backend
celery -A core beat --loglevel=info
```

## Periodic Tasks

The following tasks are scheduled automatically:

1. **`check_monitored_sites`** - Runs every 1 minute
   - Checks all monitored sites that are due for checking
   - Creates `StatusCheck` records
   - Detects incidents

2. **`check_discovered_pages`** - Runs every 15 minutes
   - Checks discovered links/pages
   - Creates `LinkCheck` records

3. **`aggregate_response_time_history`** - Runs daily at 2 AM
   - Aggregates `StatusCheck` records into `ResponseTimeHistory`
   - Creates hourly and daily aggregates

4. **`cleanup_monitoring_data`** - Runs daily at 3 AM
   - Deletes `StatusCheck` and `LinkCheck` records older than 30 days
   - Resolves old ongoing incidents

## Manual Task Execution

You can also run tasks manually:

```python
from monitoring.tasks import check_monitored_sites, check_discovered_pages

# Run immediately
check_monitored_sites.delay()
check_discovered_pages.delay()
```

Or via Django shell:
```bash
python manage.py shell
>>> from monitoring.tasks import check_monitored_sites
>>> check_monitored_sites.delay()
```

## Monitoring Task Status

Check Celery task status in Django admin or via Flower (optional):

```bash
pip install flower
celery -A core flower
```

Then visit: http://localhost:5555

## Troubleshooting

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `CELERY_BROKER_URL` in settings

### Tasks Not Running
- Ensure Celery worker is running
- Ensure Celery Beat is running (for periodic tasks)
- Check logs for errors

### Tasks Running But No Data
- Check that `MonitoredSite` records exist
- Verify `check_interval` is set correctly
- Check `last_check` timestamps

## Production Deployment

For production, use a process manager like Supervisor or systemd:

**Supervisor example (`/etc/supervisor/conf.d/celery.conf`):**
```ini
[program:celery_worker]
command=/path/to/venv/bin/celery -A core worker --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/celery/worker.err.log
stdout_logfile=/var/log/celery/worker.out.log

[program:celery_beat]
command=/path/to/venv/bin/celery -A core beat --loglevel=info
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/celery/beat.err.log
stdout_logfile=/var/log/celery/beat.out.log
```

