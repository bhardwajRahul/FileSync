<div align="center">
<img src="web/assets/icon.png" alt="FileSync Logo" width="80">
<h1 align="center">FileSync</h1>

**Send files from one device to many in real-time**

<p align="center">
<a href="https://github.com/polius/filesync/actions/workflows/release.yml"><img src="https://github.com/polius/filesync/actions/workflows/release.yml/badge.svg"></a>&nbsp;<a href="https://github.com/polius/filesync/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/polius/filesync"></a>&nbsp;<a href="https://hub.docker.com/r/poliuscorp/filesync"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/poliuscorp/filesync"></a>
</p>

<br>

<p align="center">
<b>FileSync</b> is a file sharing web application that allows users to transfer files between multiple devices with end-to-end encryption.
</p>

<br>

![FileSync](web/assets/filesync.png?v=3.4.0)

</div>

# Installation

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Python 3 (for generating the secret key)

## Quick Start

### Option 1: HTTP (Local Development)

**1. Download the required files**

Get [docker-compose.yml](deploy/docker-compose.yml) from the `deploy` folder.

**2. Generate a secret key**

Run the following command to generate a secure 32-byte base64-encoded secret:

```bash
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

**3. Configure the secret**

Open `docker-compose.yml` and replace **both occurrences** of `<SECRET_KEY>` with the generated value.

Example:
```yaml
...
- --static-auth-secret=/RaFOHJQQPAAXRNdaDhfBghvX9+o9UJEazKgIopK3TI=
...
- SECRET_KEY=/RaFOHJQQPAAXRNdaDhfBghvX9+o9UJEazKgIopK3TI=
...
```

**4. Start FileSync**

```bash
docker-compose up -d
```

Access FileSync at `http://localhost:80`

### Option 2: HTTPS (Production with Custom Domain)

**1. Download the required files**

Get [docker-compose-ssl.yml](deploy/docker-compose-ssl.yml) and [Caddyfile](deploy/Caddyfile) from the `deploy` folder.

**2. Generate a secret key**

Run the following command to generate a secure 32-byte base64-encoded secret:

```bash
python3 -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

**3. Configure the secret**

Open `docker-compose-ssl.yml` and replace **both occurrences** of `<SECRET_KEY>` with the generated value.

Example:
```yaml
...
- --static-auth-secret=/RaFOHJQQPAAXRNdaDhfBghvX9+o9UJEazKgIopK3TI=
...
- SECRET_KEY=/RaFOHJQQPAAXRNdaDhfBghvX9+o9UJEazKgIopK3TI=
...
```

**4. Configure your domain**

Open `Caddyfile` and replace `yourdomain.com` with your actual domain.

Example:
```
filesync.app {
	reverse_proxy filesync:80
}
```

**5. Start FileSync**

```bash
docker-compose -f docker-compose-ssl.yml up -d
```

Caddy will automatically obtain and manage SSL certificates from Let's Encrypt.

Access FileSync at `https://yourdomain.com`

## Stopping FileSync

```bash
# For HTTP setup
docker-compose down

# For HTTPS setup
docker-compose -f docker-compose-ssl.yml down
```

## Required Ports

To expose FileSync to the internet, ensure the following ports are open on your server/firewall:

### HTTP Setup
- **Port 80** (TCP) - Web interface
- **Port 3478** (TCP + UDP) - STUN/TURN server (NAT traversal)
- **Ports 50000–50100** (UDP) - TURN relay range

### HTTPS Setup
- **Port 443** (TCP) - Web interface (HTTPS)
- **Port 3478** (TCP + UDP) - STUN/TURN server (NAT traversal)
- **Ports 50000–50100** (UDP) - TURN relay range

> **Note:** Port 3478 is required for peer-to-peer connection setup. The 50000–50100 UDP range carries TURN-relayed traffic when peers cannot connect directly — typically ~5–10% of connections, most often when a peer is behind symmetric NAT or a UDP-blocking firewall.

## Customizing Ports

### Changing the HTTP Port

By default, FileSync uses port 80. To use a different port (e.g., 8080):

**1. Edit `docker-compose.yml`**

Find the `ports` section under the `filesync` service:

```yaml
ports:
  - "80:80"
```

Change the **first** port number to your desired port:

```yaml
ports:
  - "8080:80"
```

**2. Access FileSync**

Access FileSync at `http://localhost:8080` (or your server IP with the new port).

> **Note:** The second port number (80) should remain unchanged as it refers to the internal container port.

### Changing the HTTPS Port

To use a custom external port, deploy a separate reverse proxy (Nginx, Traefik, or standalone Caddy) that:
- Listens on port 443 with SSL termination
- Forwards traffic to FileSync on your custom internal HTTP port

This approach maintains standard HTTPS on port 443 while allowing flexible internal port configuration.

## Under the hood

FileSync uses native [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) to transfer files between multiple devices. Files shared are peer-to-peer, which means there is a direct file transfer between the sender and receiver without any intermediate server. Your files remain private and secure throughout the entire transfer process.

A lightweight WebSocket signaling server (served at `/ws` by the FileSync app itself) assists with the initial connection setup — relaying SDP offers/answers and ICE candidates between peers. Once a P2P connection is established, the signaling server steps back and file bytes flow directly between browsers. The server never has access to file contents.

### How received files are saved

FileSync writes received files to disk as the bytes arrive, so transfers use almost no memory regardless of size. It uses the first method the browser supports, falling back in order:

1. **File System Access API** — streams straight to a file you pick. Desktop Chromium browsers (Chrome, Edge, Brave, Opera) over HTTPS.
2. **Service Worker** — streams into a normal browser download. All modern browsers over HTTPS.
3. **Blob** — buffers the whole file in memory, then saves it. Last resort; the only option over plain HTTP, and unreliable past ~500 MB.

The first two require a secure context (HTTPS, or `localhost`), so **serving FileSync over HTTPS is recommended** — it enables memory-safe transfers of any size.

![File Transfer - https://xkcd.com/949](web/assets/comic.png)