# GitHub Codespaces

This repository uses a Node.js 22 development container. When a codespace is created or rebuilt, it runs `npm ci` from `package-lock.json` and forwards port 3000.

Start the application inside the codespace:

```bash
npm run dev:codespaces
```

In the **Ports** panel, set port 3000 to **Public** only when the preview should be shared, then copy its forwarded address.

After changing `Dockerfile` or `.devcontainer/devcontainer.json`, run **Codespaces: Rebuild Container** from the command palette.
