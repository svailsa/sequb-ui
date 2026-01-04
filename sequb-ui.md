# Sequb Frontend Architecture (`sequb-ui`)

**Version:** 1.0.0 (REST Sidecar & SDUI)
**Status:** Approved for Build
**Frontend Repo:** [github.com/svailsa/sequb-ui](https://github.com/svailsa/sequb-ui)
**Backend Repo:** [github.com/svailsa/sequb-protocol](https://github.com/svailsa/sequb-protocol)

---

## 1. Executive Summary

**Sequb UI** is a desktop shell built with **Tauri v2**. Unlike traditional desktop apps that contain their own logic, Sequb UI acts as a **visual client** for a locally running instance of the `sequb-server`.

* **The Engine (Sidecar):** When the app launches, Tauri spawns the `sequb-server` binary in the background. This binary handles all compute, database (`Redb`), and plugin execution (`Wasmtime`).
* **The Interface (SDUI):** The React frontend is "dumb." It does not know hardcoded logic for specific nodes. Instead, it requests a **UI Registry** from the server on boot and dynamically renders the interface based on the backend's instructions.

---

## 2. High-Level Architecture

### The Data Loop
1.  **Launch:** User opens Sequb UI.
2.  **Spawn:** Tauri starts `sequb-server` on a random free port (or default 3000).
3.  **Handshake:** Frontend probes `GET /health` until the server is ready.
4.  **Schema Fetch:** Frontend calls `GET /api/v1/nodes/registry` to learn what nodes exist.
5.  **Interaction:** User actions (Drag, Drop, Run) are converted to REST API calls.

---

## 3. Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **App Shell** | **Tauri v2** | Process management, Native Windowing, OS Menu. |
| **Backend Binary** | **Sequb Server** | The existing Axum/Rust binary (Sidecar). |
| **Frontend Core** | **React 18** | UI Rendering. |
| **Graph Engine** | **ReactFlow (xyflow)** | Canvas physics (Zoom, Pan, Drag). |
| **State** | **Zustand** | Stores the Graph State and Node Registry. |
| **Data Fetching** | **TanStack Query** | Caching API responses and handling loading states. |
| **Styling** | **Tailwind + Shadcn/ui** | Design system. |

---

## 4. The "Sidecar" Lifecycle Management
*Managing the backend process is the most critical responsibility of the frontend shell.*

**Process:**
1.  **Bundling:** The `sequb-server` executable is renamed to `sequb-server-x86_64-windows.exe` (etc.) and placed in `src-tauri/binaries/`.
2.  **Configuration:** `tauri.conf.json` defines it as an external binary.
3.  **Startup Logic (`src-tauri/src/main.rs`):**
    * Tauri spawns the sidecar.
    * **Crucial:** It passes a generic `PORT` env var or reads the port from the server's stdout if dynamic.
    * **Orphan Killing:** Implementing a "Heartbeat" or ensuring the sidecar is killed when the main window closes is required to prevent zombie processes.

---

## 5. Server-Driven UI (SDUI) Implementation

This is how we support **Wasm Plugins** without recompiling the frontend.

### A. The Registry Endpoint (Backend Requirement)
The frontend expects `sequb-server` to provide this JSON structure at `GET /api/v1/nodes/registry`:

```json
{
  "categories": ["Triggers", "AI Models", "Integrations"],
  "nodes": {
    "slack_send": {
      "label": "Send Slack Message",
      "category": "Integrations",
      "icon": "slack",
      "inputs": [
        { "key": "channel", "widget": "text", "label": "Channel ID" },
        { "key": "message", "widget": "textarea", "label": "Message Body" }
      ],
      "outputs": [
        { "key": "status", "label": "Success/Fail" }
      ]
    }
  }
}

```

### B. The Universal Node Component (`UniversalNode.tsx`)

We delete all specific node components (e.g., `SlackNode.tsx`). Instead, we use one generic component:

1. **Props:** Receives `data.nodeType` (e.g., `"slack_send"`).
2. **Lookup:** Finds the definition in the global `RegistryStore`.
3. **Render:**
* Dynamically generates input handles (dots) on the left.
* Dynamically generates output handles on the right.
* Renders the icon specified in the JSON string.



### C. The Dynamic Properties Panel

When a user clicks a node, the sidebar inspects the `inputs` array from the registry:

* If `widget: "text"`  Render `<Input />`
* If `widget: "model_picker"`  Render `<Select />` populated with API models.
* If `widget: "code"`  Render `<MonacoEditor />`

---

## 6. Directory Structure

```text
sequb-ui/
├── src-tauri/
│   ├── binaries/            # Where the compiled sequb-server goes
│   ├── src/main.rs          # Sidecar spawning logic
│   └── tauri.conf.json      # Sidecar config
├── src/
│   ├── features/
│   │   ├── canvas/
│   │   │   ├── UniversalNode.tsx  # The ONLY node component we need
│   │   │   └── GraphCanvas.tsx    # ReactFlow wrapper
│   │   ├── properties/
│   │   │   ├── DynamicForm.tsx    # JSON Schema Form renderer
│   │   │   └── widgets/           # Atomic inputs (Text, Select, Toggle)
│   │   └── monitor/               # Logs & Output terminal
│   ├── lib/
│   │   ├── api.ts           # Axios instance (BaseURL = localhost:3000)
│   │   └── registry.ts      # Logic to fetch/parse SDUI schema
│   ├── stores/
│   │   ├── useGraphStore.ts # Current Workflow State
│   │   └── useRegistry.ts   # Available Nodes (from Backend)
│   ├── types/
│   │   └── schema.d.ts      # TS Interfaces matching Backend Structs
│   └── App.tsx
└── package.json

```

---

## 7. API Integration Strategy

We use **Axios** + **TanStack Query** to bridge the React App and the Rust Sidecar.

### The Client (`src/lib/api.ts`)

```typescript
import axios from "axios";

// MVP: Hardcoded port. Production: Read from Tauri ENV.
export const API_URL = "http://localhost:3000/api/v1";

export const client = axios.create({
  baseURL: API_URL,
});

export const api = {
  registry: {
    get: () => client.get("/nodes/registry"), // The SDUI Endpoint
  },
  workflow: {
    list: () => client.get("/workflows"),
    execute: (id: string, data: any) => client.post(`/workflows/${id}/execute`, data),
    getStatus: (runId: string) => client.get(`/executions/${runId}`),
  },
  plugins: {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append("plugin", file);
        return client.post("/plugins", formData);
    }
  }
};

```

---

## 8. Development Workflow

To work on this effectively without constantly rebuilding the binary:

1. **Terminal 1 (Backend):**
* Run your existing server manually.
* `cd sequb-protocol && cargo run --bin sequb-server`
* *Server listens on port 3000.*


2. **Terminal 2 (Frontend):**
* Run Tauri in "dev" mode.
* `cd sequb-ui && npm run tauri dev`
* *React loads, connects to localhost:3000.*



---

## 9. Security & Production Considerations

1. **Localhost Auth:** To prevent other websites from hitting `localhost:3000`, the `sequb-server` should generate a random token on startup and print it to `stdout`. Tauri reads this token and injects it into Axios headers (`x-sequb-auth`).
2. **Zombie Processes:** Ensure `src-tauri/src/main.rs` listens for the `tauri::WindowEvent::Destroyed` event and kills the child process (`sequb-server`) explicitly.

```

```