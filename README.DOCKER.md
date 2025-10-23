# Dockerization

This project includes Dockerfiles and docker-compose setups for running the API together with a MariaDB (Alpine) server.

Files added:
- `Dockerfile` - multi-stage image that builds TypeScript and runs the compiled JS.
- `.dockerignore` - avoid copying local artifacts and secrets into images.
- `docker-compose.yml` - production-like compose file (builds image and starts a MySQL container).
- `docker-compose.dev.yml` - development compose with source mounted and `npm run dev` for hot reload.

Quick start (development):

1. Create a `.env` in repo root (same format as existing `.env`) with DB_USER, DB_PASS, DB_NAME.
2. Run:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

Quick start (production-like):

```powershell
docker compose up --build
```

Notes on resources and what changes when dockerizing
- Using Alpine-based images reduces final image size and attack surface (we use `node:18-alpine` and `mariadb:11.3.2-alpine`).
- Multi-stage builds keep the runtime image small by compiling TypeScript in a separate stage and copying only the compiled JS and production deps into the final image.
- Restart policy and resource limits are added in compose as hints; in production an orchestrator (Kubernetes, ECS) should control resources.
- I/O: containerized volumes can have different performance characteristics, especially on Windows with mounted host volumes. For best performance in prod, use named volumes for the database and avoid bind-mounting source code.

Security & secrets
- Keep `.env` out of the repository (it's already in `.gitignore`). For production, prefer Docker secrets or environment variable management in the orchestrator (Kubernetes, cloud services).

If you want, I can:
- Build and run the compose dev stack here and show logs.
- Adjust the start script or the Dockerfile to match a different build layout.
- Remove the `ports` mapping for MySQL to avoid host port conflicts (recommended for production).
