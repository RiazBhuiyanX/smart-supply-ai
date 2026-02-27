# 📦 SmartSupply AI

> **Intelligent Enterprise Resource Planning (ERP) for Inventory & Supply Chain Management**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-smart--supply--ai.vercel.app-blue?style=for-the-badge)](https://smart-supply-ai.vercel.app/login)
[![Backend API](https://img.shields.io/badge/⚙️_API-smart--supply--ai.onrender.com-green?style=for-the-badge)](https://smart-supply-ai.onrender.com)

SmartSupply AI is a modern, full-stack ERP system for managing inventory, procurement, and warehousing — powered by an AI assistant that understands your data and answers business questions in natural language.

---

## ✨ Key Features

### 📊 Inventory Management
- Centralized product catalog with SKU tracking and categorization
- Real-time stock levels across multiple warehouses
- Low-stock warnings based on configurable safety thresholds
- Full audit trail of all inventory movements (who, when, why)

### 🛒 Procurement Cycle
- Create and manage Purchase Orders with a status workflow (Draft → Sent → Received → Cancelled)
- Automatic inventory updates on goods receipt
- Supplier management with contact details and order history

### 🤖 AI Smart Assistant (RAG)
- Integrated chat assistant powered by **Google Gemini**
- **Retrieval-Augmented Generation (RAG):** The AI queries your live database and answers questions like:
  - *"Which products are running low?"*
  - *"What is the total inventory value in Warehouse Sofia?"*
  - *"Who is our highest-volume supplier?"*

### 🔐 Security & Access Control
- JWT-based authentication with secure password hashing (BCrypt)
- Role-Based Access Control (RBAC) with roles: Admin, Manager, Operator
- Protected API endpoints with Spring Security

### 📈 Dashboard & Analytics
- Real-time statistics: total products, warehouses, orders, inventory value
- Visual overview of key business metrics
- Responsive design optimized for desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS 4, Shadcn UI, Radix UI, Lucide Icons |
| **Backend** | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL 15 |
| **AI** | Google Gemini API (gemini-2.5-flash-lite) |
| **Infrastructure** | Docker, Docker Compose, Redis (Caching) |
| **Deployment** | Vercel (Frontend), Render (Backend + Database) |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                      │
│           React + TypeScript + Vite + TailwindCSS             │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Dashboard │ │Inventory │ │  Orders  │ │  AI Assistant    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API (HTTPS)
┌──────────────────────▼───────────────────────────────────────┐
│                      Backend (Render)                         │
│               Spring Boot 3 + Spring Security                 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Auth    │ │Inventory │ │Procure-  │ │   AI Service     │ │
│  │Controller│ │Controller│ │ment Ctrl │ │  (Gemini RAG)    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │ JPA / Hibernate
┌──────────────────────▼───────────────────────────────────────┐
│                   PostgreSQL 15 (Render)                      │
│                                                              │
│  Products │ Warehouses │ Inventory │ Orders │ Users │ Audit   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Java 21** (JDK)
- **Maven 3.9+**
- **Node.js 18+** & **npm**
- **Docker** & **Docker Compose** (for PostgreSQL & Redis)
- **Gemini API Key** ([Get one here](https://aistudio.google.com/apikey)) — optional, for AI features

### 1. Clone the Repository

```bash
git clone https://github.com/RiazBhuiyanX/smart-supply-ai.git
cd smart-supply-ai
```

### 2. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
POSTGRES_USER=smartsupply
POSTGRES_PASSWORD=your_password
POSTGRES_DB=smartsupply_db

SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/smartsupply_db
JWT_SECRET=your-secret-key-at-least-32-characters-long
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Start the Backend

```bash
cd backend-java
mvn spring-boot:run
```

The API server starts at `http://localhost:8080`.

### 5. Seed Mock Data (Optional)

To populate the database with sample Bulgarian-localized test data:

```bash
cd backend-java
mvn spring-boot:run -Dspring-boot.run.profiles=seed
```

This creates 12 suppliers, 50 products, 8 warehouses, inventory items, 30 purchase orders, and movement history.

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## 📁 Project Structure

```
smart-supply-ai/
├── frontend/                  # React + TypeScript SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components (Shadcn)
│   │   ├── pages/             # Page-level components
│   │   ├── lib/               # API client, utilities
│   │   └── App.tsx            # Routes & layout
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
│
├── backend-java/              # Spring Boot REST API
│   ├── src/main/java/com/smartsupply/
│   │   ├── config/            # Security, CORS, DataSeeder
│   │   ├── controller/        # REST endpoints
│   │   ├── dto/               # Request/Response DTOs
│   │   ├── entity/            # JPA entities
│   │   ├── repository/        # Spring Data repositories
│   │   ├── service/           # Business logic + AI service
│   │   └── exception/         # Global error handling
│   ├── Dockerfile             # Production container
│   └── pom.xml                # Maven dependencies
│
├── docker-compose.yml         # Local PostgreSQL + Redis
├── project-desc.md            # Project description
└── user-stories.md            # User stories & acceptance criteria
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login & receive JWT token |

### Products
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/{id}` | Update a product |
| `DELETE` | `/api/products/{id}` | Delete a product |

### Inventory
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory` | List inventory items |
| `POST` | `/api/inventory` | Add inventory item |
| `GET` | `/api/inventory/movements` | View movement history |
| `POST` | `/api/inventory/movements` | Record a movement |

### Purchase Orders
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/purchase-orders` | List all orders |
| `POST` | `/api/purchase-orders` | Create an order |
| `PUT` | `/api/purchase-orders/{id}` | Update order |
| `POST` | `/api/purchase-orders/{id}/receive` | Receive goods |

### Warehouses & Suppliers
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/warehouses` | List warehouses |
| `POST` | `/api/warehouses` | Create warehouse |
| `GET` | `/api/suppliers` | List suppliers |
| `POST` | `/api/suppliers` | Create supplier |

### AI Assistant
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Send a message to the AI assistant |

### Statistics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/statistics/dashboard` | Dashboard statistics |

---

## ☁️ Deployment

The application is deployed on free-tier cloud services:

| Service | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [smart-supply-ai.vercel.app](https://smart-supply-ai.vercel.app/login) |
| **Backend** | Render | [smart-supply-ai.onrender.com](https://smart-supply-ai.onrender.com) |
| **Database** | Render PostgreSQL | Internal connection |

### Environment Variables (Production)

| Variable | Service | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Vercel | Backend API URL |
| `SPRING_DATASOURCE_URL` | Render | PostgreSQL JDBC connection string |
| `POSTGRES_USER` | Render | Database username |
| `POSTGRES_PASSWORD` | Render | Database password |
| `JWT_SECRET` | Render | Secret key for JWT signing |
| `CORS_ORIGINS` | Render | Allowed frontend origins (comma-separated) |
| `GEMINI_API_KEY` | Render | Google Gemini API key |

> **Note:** Render free-tier services spin down after inactivity. The first request may take ~30 seconds while the service restarts.

---

## 👥 User Roles

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full access — manage users, configuration, all CRUD operations |
| **Manager** | View dashboards, manage inventory, create & approve purchase orders, use AI assistant |
| **Operator** | Receive goods, record inventory movements, view stock levels |

---

## 📄 License

This project is developed as part of an academic/enterprise demonstration. All rights reserved.

---

<p align="center">
  Built with ❤️ using React, Spring Boot & Gemini AI
</p>
