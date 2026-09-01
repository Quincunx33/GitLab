#!/bin/bash

# Update metadata.json
cat << 'JSON_EOF' > metadata.json
{
  "name": "PushFlow",
  "description": "PushFlow is a modern, fully-featured GitHub and GitLab web client. Manage repositories, edit code in real-time, stage commits, and track history seamlessly.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
JSON_EOF

# Update public/manifest.json
cat << 'JSON_EOF' > public/manifest.json
{
  "name": "PushFlow",
  "short_name": "PushFlow",
  "description": "PushFlow is a modern, fully-featured GitHub and GitLab web client. Manage repositories, edit code in real-time, stage commits, and track history seamlessly.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e1e1e",
  "theme_color": "#0066b8",
  "orientation": "any",
  "icons": [
    {
      "src": "/gitlab_logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
JSON_EOF

# Create public/robots.txt
cat << 'TXT_EOF' > public/robots.txt
User-agent: *
Allow: /

Sitemap: https://pushflow.pages.dev/sitemap.xml
TXT_EOF

# Create public/sitemap.xml
cat << 'XML_EOF' > public/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pushflow.pages.dev/</loc>
    <lastmod>2026-08-31</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
XML_EOF

