#!/usr/bin/env python3
"""测试 fetch_news 的导入问题"""

import sys
print("Step 1: Starting...", flush=True)

import json
print("Step 2: json imported", flush=True)

import re
print("Step 3: re imported", flush=True)

import time
print("Step 4: time imported", flush=True)

import hashlib
print("Step 5: hashlib imported", flush=True)

import os
print("Step 6: os imported", flush=True)

from datetime import datetime, timedelta
print("Step 7: datetime imported", flush=True)

from concurrent.futures import ThreadPoolExecutor, as_completed
print("Step 8: concurrent.futures imported", flush=True)

from urllib.parse import urljoin
print("Step 9: urljoin imported", flush=True)

from pathlib import Path
print("Step 10: Path imported", flush=True)

import requests
print("Step 11: requests imported", flush=True)

from bs4 import BeautifulSoup
print("Step 12: BeautifulSoup imported", flush=True)

print("All imports successful!", flush=True)
