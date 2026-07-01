#!/usr/bin/env python3
"""Parse metadata dari HTML, upload gambar ke Cloudinary, kirim payload ke n8n."""

import json
import os
import sys
from pathlib import Path

import cloudinary
import cloudinary.uploader
import requests
from bs4 import BeautifulSoup

def parse_meta(html_path: str) -> dict:
    soup = BeautifulSoup(Path(html_path).read_text(encoding="utf-8"), "html.parser")
    tag = soup.find("script", id="vourdev-meta")
    if not tag:
        print("⚠️  Tidak ada blok #vourdev-meta — kirim caption/hashtag kosong.")
        return {"title": "", "caption": "", "hashtags": []}
    return json.loads(tag.string)

def upload_images(image_dir: str) -> list[str]:
    cloudinary.config(cloudinary_url=os.environ["CLOUDINARY_URL"])
    urls = []
    for f in sorted(Path(image_dir).glob("*.png")):
        result = cloudinary.uploader.upload(str(f), folder="vourdev-carousels")
        urls.append(result["secure_url"])
        print(f"  uploaded: {f.name} → {result['secure_url']}")
    return urls

def main():
    html_path = sys.argv[1]
    image_dir = sys.argv[2]

    meta = parse_meta(html_path)
    image_urls = upload_images(image_dir)

    payload = {
        "images": image_urls,
        "title": meta.get("title", ""),
        "caption": meta.get("caption", ""),
        "hashtags": meta.get("hashtags", []),
    }

    resp = requests.post(
        os.environ["N8N_WEBHOOK_URL"],
        json=payload,
        headers={"X-Webhook-Secret": os.environ["WEBHOOK_SECRET"]},
        timeout=30,
    )
    resp.raise_for_status()
    print(f"✅ Notified n8n — status {resp.status_code}")

if __name__ == "__main__":
    main()