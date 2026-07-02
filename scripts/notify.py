#!/usr/bin/env python3
"""Parse metadata dari HTML, upload gambar ke Cloudinary (arsip) + ImgBB (delivery ke Buffer)."""

import base64
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


def upload_to_cloudinary(image_dir: str) -> None:
    """Upload ke Cloudinary untuk arsip — URL-nya tidak dipakai untuk Buffer."""
    cloudinary.config(cloudinary_url=os.environ["CLOUDINARY_URL"])
    for f in sorted(Path(image_dir).glob("*.png")):
        result = cloudinary.uploader.upload(
            str(f),
            folder="vourdev-carousels",
            resource_type="image",
            type="upload",
        )
        print(f"  cloudinary: {f.name} → {result['secure_url']}")


def upload_to_imgbb(image_dir: str) -> list[str]:
    """Upload ke ImgBB — URL ini yang dikirim ke Buffer (100% public)."""
    api_key = os.environ["IMGBB_API_KEY"]
    urls = []
    for f in sorted(Path(image_dir).glob("*.png")):
        with open(f, "rb") as img:
            b64 = base64.b64encode(img.read()).decode("utf-8")

        resp = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": api_key, "image": b64, "name": f.stem},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        url = data["data"]["url"]
        urls.append(url)
        print(f"  imgbb:      {f.name} → {url}")
    return urls


def main():
    html_path = sys.argv[1]
    image_dir = sys.argv[2]

    meta = parse_meta(html_path)

    # Upload ke Cloudinary untuk arsip
    upload_to_cloudinary(image_dir)

    # Upload ke ImgBB untuk delivery ke Buffer
    image_urls = upload_to_imgbb(image_dir)

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
