#!/usr/bin/env python3
"""
Setup 9router di Hugging Face Space untuk hadi-kaya-virtual-office.
Creates Space, uploads Dockerfile + README + .env config, then triggers build.

NOTE: Token adalah WRITE token user (akan di-revoke setelah setup selesai).
"""

import os
import sys
import time
import requests
from huggingface_hub import HfApi, create_repo, upload_file
from huggingface_hub.utils import HfHubHTTPError

HF_TOKEN = os.environ.get('HF_TOKEN') or sys.argv[1] if len(sys.argv) > 1 else ''
SPACE_NAME = '9router'  # akan jadi hadiliega-9router.hf.space
SPACE_REPO_ID = f'hadiliega/{SPACE_NAME}'

if not HF_TOKEN:
    print('ERROR: HF_TOKEN env var tidak ditemukan')
    sys.exit(1)

# === Dockerfile untuk 9router di HF Space ===
# HF Space wajib:
# - Run as user 'user' (UID 1000)
# - Listen port 7860
# - Persistent storage di /data (auto-mounted)
DOCKERFILE = """# 9router di Hugging Face Space
# https://github.com/decolua/9router
FROM node:20-slim

# Install system dependencies (curl untuk healthcheck, git untuk npm packages)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl git ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (HF Space wajib UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \\
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install 9router globally (user-level)
RUN npm install -g 9router@latest 2>&1 | tail -5

# Create data directory for persistent storage
RUN mkdir -p /data/9router && chown -R user:user /data/9router

# Environment variables
ENV PORT=7860 \\
    HOSTNAME=0.0.0.0 \\
    NEXT_PUBLIC_BASE_URL=https://hadiliega-9router.hf.space \\
    DATA_DIR=/data/9router \\
    JWT_SECRET=hf-9router-hadi-kaya-$(date +%s)

# Expose HF-required port
EXPOSE 7860

# Healthcheck
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=3 \\
    CMD curl -f http://localhost:7860/api/health || exit 1

# Start 9router
CMD ["9router"]
"""

README_MD = """---
title: 9router
emoji: 🤖
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: LLM Router untuk hadi-kaya-virtual-office
---

# 9router — Hadi Kaya Virtual Office

LLM router/proxy untuk hadi-kaya-virtual-office.vercel.app

## Setup
1. Buka https://hadiliega-9router.hf.space/dashboard
2. Login dengan admin password (lihat logs Space)
3. Connect providers:
   - Kiro AI (OAuth, FREE unlimited Claude 4.5)
   - OpenCode Free (no auth, toggle on)
   - Gemini (Google AI Studio API key)
   - OpenRouter (API key, free models)
4. Create combos:
   - `dina-combo`: kr/claude-sonnet-4.5 → oc/<auto> → gc/gemini-3-flash
   - `rina-combo`: kr/claude-sonnet-4.5 → kr/glm-5 → gc/gemini-3-flash
   - `marketing-combo`: oc/<auto> → kr/glm-5 → gc/gemini-3-flash
5. Copy API key dari dashboard
6. Set di Vercel:
   - LLM_ENDPOINT=https://hadiliega-9router.hf.space/v1
   - LLM_API_KEY=<9router-api-key>
   - LLM_MODEL_DINA=dina-combo

## Auto-sleep workaround
HF Space free tier auto-sleeps after 30 min idle.
Vercel cron ping tiap 10 menit untuk keep alive.

## Reference
- 9router repo: https://github.com/decolua/9router
- 9router docs: https://github.com/decolua/9router#readme
"""


def main():
    print(f'=== Setup 9router HF Space ===')
    print(f'User: hadiliega')
    print(f'Space: {SPACE_REPO_ID}')
    print()

    api = HfApi(token=HF_TOKEN)

    # Step 1: Create Space
    print('[1/4] Creating HF Space...')
    try:
        create_repo(
            repo_id=SPACE_REPO_ID,
            repo_type='space',
            space_sdk='docker',
            space_hardware='cpu-basic',
            private=False,
            token=HF_TOKEN,
            exist_ok=False,
        )
        print(f'  ✅ Space created: https://huggingface.co/spaces/{SPACE_REPO_ID}')
    except HfHubHTTPError as e:
        if 'already exists' in str(e).lower():
            print(f'  ⚠️ Space sudah ada, lanjut upload files')
        else:
            raise

    # Step 2: Upload Dockerfile
    print()
    print('[2/4] Uploading Dockerfile...')
    dockerfile_path = '/tmp/9router-Dockerfile'
    with open(dockerfile_path, 'w') as f:
        f.write(DOCKERFILE)
    upload_file(
        path_or_fileobj=dockerfile_path,
        path_in_repo='Dockerfile',
        repo_id=SPACE_REPO_ID,
        repo_type='space',
        token=HF_TOKEN,
    )
    print('  ✅ Dockerfile uploaded')

    # Step 3: Upload README.md (with HF Space metadata)
    print()
    print('[3/4] Uploading README.md...')
    readme_path = '/tmp/9router-README.md'
    with open(readme_path, 'w') as f:
        f.write(README_MD)
    upload_file(
        path_or_fileobj=readme_path,
        path_in_repo='README.md',
        repo_id=SPACE_REPO_ID,
        repo_type='space',
        token=HF_TOKEN,
    )
    print('  ✅ README.md uploaded')

    # Step 4: Check build status
    print()
    print('[4/4] Triggering build...')
    print('  Space URL: https://huggingface.co/spaces/' + SPACE_REPO_ID)
    print('  Embed URL: https://hadiliega-9router.hf.space')
    print()
    print('  Build akan jalan otomatis (~5-10 menit untuk install 9router).')
    print('  Cek status: https://huggingface.co/spaces/' + SPACE_REPO_ID + '?view=logs')
    print()
    print('=== Setup selesai ===')
    print()
    print('NEXT STEPS (manual, oleh owner):')
    print('1. Tunggu 5-10 menit sampai Space status: "Running"')
    print('2. Buka: https://hadiliega-9router.hf.space/dashboard')
    print('3. Login pakai admin password (cek di logs Space — JWT_SECRET auto-generated)')
    print('   Atau reset password: di Environment Variables HF Space, set ADMIN_PASSWORD=xxx')
    print('4. Connect providers (Kiro AI, OpenCode Free, Gemini, OpenRouter)')
    print('5. Create combos (dina-combo, rina-combo, marketing-combo)')
    print('6. Copy API key dari dashboard → set di Vercel env vars')
    print()
    print('⚠️ REVOKE HF TOKEN SETELAH INI! Token udah ke-share di chat.')
    print('   https://huggingface.co/settings/access-tokens')


if __name__ == '__main__':
    main()
