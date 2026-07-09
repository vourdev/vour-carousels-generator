#!/usr/bin/env python3
"""Parse metadata dari HTML dan upload gambar ke Cloudinary (untuk arsip & Buffer)."""

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


def get_images(image_dir: str) -> list[Path]:
    """Mengambil semua file JPG dan PNG, lalu mengurutkannya."""
    images = list(Path(image_dir).glob("*.jpg")) + list(Path(image_dir).glob("*.png"))
    return sorted(images)


def upload_to_cloudinary(image_dir: str) -> list[str]:
    """Upload ke Cloudinary dan kumpulkan secure_url untuk dikirim ke n8n."""
    cloudinary.config(cloudinary_url=os.environ["CLOUDINARY_URL"])
    urls = []
    
    images = get_images(image_dir)
    if not images:
        print("❌ Error fatal: Tidak ada gambar (JPG/PNG) yang ditemukan di folder output.")
        sys.exit(1)

    for f in images:
        result = cloudinary.uploader.upload(
            str(f),
            folder="vourdev-carousels",
            resource_type="image",
            type="upload",
        )
        secure_url = result['secure_url']
        urls.append(secure_url)
        print(f"  cloudinary: {f.name} → {secure_url}")
        
    return urls


def main():
    if len(sys.argv) < 3:
        print("❌ Penggunaan: python notify.py <path_html> <folder_gambar>")
        sys.exit(1)

    html_path = sys.argv[1]
    image_dir = sys.argv[2]

    meta = parse_meta(html_path)

    # Upload ke Cloudinary dan simpan URL-nya
    image_urls = upload_to_cloudinary(image_dir)

    # Kirim payload ke n8n menggunakan URL Cloudinary
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