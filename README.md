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
- **Port 3478** (TCP + UDP) - STUN/TURN server for WebRTC

### HTTPS Setup
- **Port 443** (TCP) - Web interface (HTTPS)
- **Port 3478** (TCP + UDP) - STUN/TURN server for WebRTC

> **Note:** Port 3478 is essential for establishing peer-to-peer connections, especially when devices are behind NAT/firewalls.

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

FileSync uses [PeerJS](https://github.com/peers/peerjs) (a WebRTC wrapper) to transfer files between multiple devices. Files shared are peer-to-peer, which means there is a direct file transfer between the sender and receiver without any intermediate server. Your files remain private and secure throughout the entire transfer process.

![File Transfer - https://xkcd.com/949](web/assets/comic.png)