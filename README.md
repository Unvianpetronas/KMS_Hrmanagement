# HR Knowledge Hub - KMS
## HR Knowledge Management System: Onboarding & Policy

---

## System Architecture (Local)

```
┌─────────────────────────────────────────────────────┐
│                    Local Machine                     │
│                                                      │
│  ┌──────────────┐      ┌──────────────────────────┐  │
│  │   React App  │─────▶│   Spring Boot API        │  │
│  │  :5173       │      │   :8080                  │  │
│  └──────────────┘      └──────────┬───────────────┘  │
│                                   │                  │
│            ┌──────────────────────┼──────────────┐   │
│            │                      │              │   │
│     ┌──────▼──────┐      ┌────────▼────────┐     │   │
│     │   SQLite    │      │   LM Studio     │     │   │
│     │  hrkms.db   │      │   :1234 (AI)    │     │   │
│     └─────────────┘      └─────────────────┘     │   │
└─────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer    | Technology             | Notes                              |
|----------|------------------------|------------------------------------|
| Frontend | React 18 + Vite        | SPA, runs at `localhost:5173`      |
| Backend  | Spring Boot 3.x        | REST API at `localhost:8080`       |
| Database | SQLite (via Liquibase) | File `hrkms.db` at project root    |
| AI       | LM Studio (local)      | OpenAI-compatible API at `:1234`   |

---

## Project Structure

```
hr-kms-project/
├── backend/
│   └── src/main/java/com/hrkms/
│       ├── config/
│       │   ├── AppConfig.java               # CORS config
│       │   ├── AiConfig.java                # LM Studio client config
│       │   └── LocalDateConverter.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── KnowledgeItemController.java
│       │   ├── ChatController.java          # AI chat endpoint
│       │   └── TagController.java
│       ├── model/
│       │   ├── KnowledgeItem.java
│       │   ├── Tag.java
│       │   └── ItemRating.java              # Per-user rating record
│       ├── service/
│       │   ├── KnowledgeItemService.java
│       │   ├── AuthService.java
│       │   ├── ChatService.java             # Calls LM Studio
│       │   ├── AiProviderService.java
│       │   ├── LocalAiService.java
│       │   └── TagService.java
│       └── repository/
│           ├── KnowledgeItemRepository.java
│           ├── TagRepository.java
│           └── ItemRatingRepository.java    # Per-user rating lookup
│   └── src/main/resources/
│       ├── application.properties           # Main config (do NOT commit secrets)
│       └── db/
│           ├── 001-initial-schema.sql
│           ├── 002-km-framework.sql
│           └── 003-item-ratings.sql         # Per-user rating table
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   ├── KMS/
│       │   ├── Chat/                        # AI chat UI
│       │   ├── Admin/
│       │   └── Layout/
│       ├── contexts/AuthContext.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── constants.js
│       └── utils/
├── hrkms.db                                 # SQLite DB (not committed)
└── README.md
```

---

## Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+**
- **LM Studio** — download at https://lmstudio.ai

---

## Running Locally

### Step 1 — Start LM Studio (AI)

1. Open LM Studio
2. Download a model (recommended: `mistral`, `llama3`, or any GGUF model)
3. Go to the **Local Server** tab and click **Start Server**
4. Server runs at `http://localhost:1234` by default
5. Select the model you want to use in the dropdown before starting

> LM Studio exposes an OpenAI-compatible API. The backend calls `http://localhost:1234/v1/chat/completions`.

---

### Step 2 — Configure Backend

Open `backend/src/main/resources/application.properties` and verify:

```properties
# Database (SQLite)
spring.datasource.url=jdbc:sqlite:../hrkms.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.jpa.hibernate.ddl-auto=none
spring.liquibase.enabled=true

# JWT
jwt.secret=your-secret-key-here

# LM Studio
ai.lmstudio.base-url=http://localhost:1234
ai.lmstudio.model=your-model-name
```

---

### Step 3 — Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

API running at: `http://localhost:8080`

---

### Step 4 — Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App running at: `http://localhost:5173`

---

## API Endpoints

### Knowledge Items
| Method   | Endpoint                                    | Description                        |
|----------|---------------------------------------------|------------------------------------|
| `GET`    | `/api/v1/items`                             | Get all knowledge items            |
| `GET`    | `/api/v1/items/{id}`                        | Get item detail                    |
| `POST`   | `/api/v1/items`                             | Create new item                    |
| `PUT`    | `/api/v1/items/{id}`                        | Update item                        |
| `DELETE` | `/api/v1/items/{id}`                        | Delete item                        |
| `GET`    | `/api/v1/items/search?q=&type=&tags=&sort=` | Search and filter                  |
| `POST`   | `/api/v1/items/{id}/rate`                   | Rate an item (1-5 stars, once per user, updatable) |
| `GET`    | `/api/v1/items/{id}/my-rating`              | Get the current user's own rating  |
| `POST`   | `/api/v1/items/{id}/comments`               | Add a comment                      |
| `POST`   | `/api/v1/items/{id}/view`                   | Record a view                      |
| `GET`    | `/api/v1/items/stale?months=12`             | Get items not updated in N months  |
| `PUT`    | `/api/v1/items/{id}/accept`                 | Accept a Suggested item (Manager)  |
| `PUT`    | `/api/v1/items/bulk-archive`                | Bulk archive items (Admin)         |

### AI Chat
| Method | Endpoint       | Description                              |
|--------|----------------|------------------------------------------|
| `POST` | `/api/v1/chat` | Chat with AI assistant via LM Studio     |

### Auth & Tags
| Method | Endpoint             | Description     |
|--------|----------------------|-----------------|
| `POST` | `/api/v1/auth/login` | Login           |
| `GET`  | `/api/v1/tags`       | Get all tags    |
| `POST` | `/api/v1/tags`       | Create new tag  |

---

## Features

- [x] Create items — Policy, FAQ, Checklist, Lesson
- [x] Search and filter by type, tags, status
- [x] 1-5 star rating — one rating per user, updatable; prior rating pre-filled on revisit
- [x] Comments
- [x] AI Chat assistant — powered by LM Studio (local, fully offline)
- [x] Role-based access — User / Manager / Admin
- [x] Knowledge suggestion flow (Suggested → Manager approves)
- [x] Stale detection — items not updated in over 12 months
- [x] Bulk archive (Admin)
- [x] Overview statistics dashboard

---

*HR Knowledge Hub — Spring Boot + React + LM Studio (local AI)*
