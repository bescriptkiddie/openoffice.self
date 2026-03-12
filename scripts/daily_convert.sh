#!/bin/bash
# Daily AI News to Self Format
# Run at 5:00 AM every day (after ai-news-radar generates report at 4:52 AM)

set -e

echo "🔄 $(date '+%Y-%m-%d %H:%M:%S') - Starting daily conversion..."

cd /root/clawd/openoffice.self

# Convert today's report
python3 scripts/convert_to_self.py

# Optional: Pack to .self file
# python3 server.py pack ./DailyAI.self --yes

echo "✅ $(date '+%Y-%m-%d %H:%M:%S') - Conversion complete!"
