
# RESTCONF Web Client (Proxy-Based)

A simple **web-based RESTCONF client** consisting of:

* A **React (Vite) frontend** served via Nginx
* A **Go backend RESTCONF proxy**
* Secure **Bearer-token authentication** handled server-side
* No CORS issues, no token exposure to the browser

---

## ✨ Key Features

* 📡 Browse and interact with RESTCONF `/data` and `/operations`
* 🔐 Bearer token authentication (never exposed to frontend)
* 🔁 Nginx reverse proxy for clean same-origin API access
* 🐳 Fully containerized with Docker Compose
* 🧹 Minimal, clean architecture (no unused files)

---

## 🧠 Architecture Overview

```
Browser
  ↓
Frontend (Nginx + React) :8081
  ↓  /restconf/*
Backend (Go RESTCONF proxy) :9000
  ↓  Authorization: Bearer <token>
RESTCONF Server / Device
```

### Important design decisions

* The **browser only talks to the frontend**
* The **frontend uses relative URLs only**
* The **backend injects the Authorization header**
* The RESTCONF device is never directly exposed

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Explorer.jsx
│   │   │   ├── Editor.jsx
│   │   │   └── Notifications.jsx
│   │   ├── config.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── nginx.conf
│   ├── package.json
│   ├── index.html
│   └── Dockerfile
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml
└── README.md
```

---

## 🔧 Configuration

### Backend environment variables

The backend requires two environment variables:

| Variable            | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `UPSTREAM_RESTCONF` | Base URL of the RESTCONF server (must include `/restconf`) |
| `RESTCONF_TOKEN`    | Bearer token used to authenticate with the RESTCONF server |

Example:

```env
UPSTREAM_RESTCONF=http://device-ip:8080/restconf
RESTCONF_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

> ⚠️ The token is **never** sent to the frontend.

---

## 🚀 Running the Application

### 1️⃣ Build and start everything

```bash
docker-compose up --build
```

### 2️⃣ Open the UI in your browser

```
http://localhost:8081
```

---

## 🔍 How API requests work

Frontend code uses **relative paths only**:

```js
fetch("/restconf/data/ietf-interfaces")
```

Nginx proxies this internally to the backend, which:

* Injects `Authorization: Bearer <token>`
* Forwards the request to the real RESTCONF server
* Returns the response unchanged

---

## 🧪 Debugging & Logs

### Backend logs

```bash
docker-compose logs -f backend
```

You will see logs such as:

```
Incoming request: GET /restconf/data/ietf-interfaces
Forwarding to: http://device/restconf/data/ietf-interfaces
Upstream response: 200 OK
```

### Frontend logs

```bash
docker-compose logs -f frontend
```

---

## ⚠️ Common Pitfalls (Already Solved)

* ❌ No CORS configuration required
* ❌ No backend URLs in frontend code
* ❌ No Authorization headers in browser
* ❌ No RESTCONF credentials exposed

---

## 🧹 About `/favicon.ico` warnings

Browsers automatically request `/favicon.ico`.
If you see 404 warnings in logs, they are harmless.

(Optional fix: add a favicon or silence it in `nginx.conf`.)

---

## 🔒 Security Notes

* Tokens are stored only in backend environment variables
* Backend port can be removed from public exposure if desired
* Nginx prevents accidental Authorization header forwarding

---

## 🧭 Future Enhancements (Optional)

* RESTCONF notifications / subscriptions
* OAuth2 / OIDC token acquisition
* Multiple RESTCONF device profiles
* HTTPS with reverse proxy (Traefik / Caddy)
* Role-based UI controls

---

## Other Points

### Vite Configuration
Port number: 3000

| Port | Meaning                                    |
| ---- | ------------------------------------------ |
| 3000 | Common React dev convention (CRA, Next.js) |
| 5173 | Vite’s default dev server port             |


host: true

This tells Vite to bind to 0.0.0.0 so it’s accessible from:

- Docker containers
- Other machines on your LAN

It is only needed if:

- You run npm run dev inside Docker, OR
- You want to access dev server from another machine

It is NOT needed when:

- You build with vite build
- You serve via Nginx
- You use docker-compose for production

So removing it was just simplification, not a requirement.

| Question                          | Answer                  |
| --------------------------------- | ----------------------- |
| Do I run `npm run dev` in Docker? | Yes → keep `host: true` |
| Do I expose dev server to LAN?    | Yes → keep `host: true` |
| Only use Docker + Nginx?          | Remove both             |

