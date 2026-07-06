# RankBoost Connector (WordPress)

Minimal WordPress plugin that connects your site to [RankBoost](https://rankboost.eu).

**Version:** 0.2.0

## Installation

1. Copy the `rankboost-connector` folder into your WordPress `wp-content/plugins/` directory:
   ```
   wp-content/plugins/rankboost-connector/
   ```
2. In WordPress admin, go to **Plugins** and activate **RankBoost Connector**.
3. Open **Settings → RankBoost**.

## Configure credentials

RankBoost provides two one-time values when you create a WordPress connection:

| Credential | Used for | Stored in WordPress |
|------------|----------|---------------------|
| **API Key** | Check connection (ping → RankBoost) | `rankboost_api_key` |
| **Shared Secret** | Draft creation (RankBoost → WordPress) | `rankboost_api_secret` |

Steps:

1. In RankBoost (Integrations → WordPress), click **Create connection key** and copy **API Key** and **Shared Secret**.
2. In WordPress (**Settings → RankBoost**), paste both values.
3. Confirm **RankBoost API URL** (default: `https://rankboost.eu`).
4. Click **Save settings**.
5. Click **Check connection** — status should become **Connected**.

After saving, full credentials are **never shown again** — only masked values.

## Check connection (ping)

The plugin sends:

```
POST {api_url}/api/wordpress/ping
Header: X-RankBoost-Key: {api_key}
Body: { "siteUrl": "...", "pluginVersion": "0.2.0" }
```

## Draft creation

RankBoost can create **draft posts only** via:

```
POST {site_url}/wp-json/rankboost/v1/drafts
Header: X-RankBoost-Secret: {shared_secret}
Body:
{
  "title": "...",
  "contentHtml": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "slug": "...",
  "language": "ru"
}
```

Response:

```json
{
  "success": true,
  "postId": 123,
  "editUrl": "https://example.com/wp-admin/post.php?action=edit&post=123"
}
```

WordPress stores RankBoost meta:

- `_rankboost_meta_title`
- `_rankboost_meta_description`
- `_rankboost_language`

Posts are always created with `post_status = draft`. The current plugin does not publish posts. Future automation features in RankBoost, if added, will require explicit user configuration, connected integrations, and rules.

## What this plugin does NOT do

- Does **not** publish posts (current version creates drafts only)
- Does **not** update existing posts
- Does **not** use HMAC request signing
- Does **not** run autopilot or background sync
- Does **not** assign categories or tags

Future RankBoost automation features, if added, will require explicit user setup in the RankBoost dashboard.

## Security

- Credentials stored in WordPress options (`rankboost_api_key`, `rankboost_api_secret`).
- Only users with `manage_options` can access settings.
- Forms use WordPress nonces.
- Input sanitized; output escaped; content filtered with `wp_kses_post`.
- Credentials are **not** logged.

## Development

```bash
php -l wordpress-plugin/rankboost-connector/rankboost-connector.php
```

## File structure

```
rankboost-connector/
├── rankboost-connector.php
└── README.md
```
