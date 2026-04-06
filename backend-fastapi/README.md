# SmartSupply AI — FastAPI Backend

A Python REST API for supply chain management with AI-powered assistant (Google Gemini).

Built with **FastAPI**, **SQLModel**, and **SQLite**.

## Tech Stack

- **FastAPI** — Web framework for building APIs
- **SQLModel** — ORM (database models + validation in one class)
- **SQLite** — File-based database (no server needed)
- **Uvicorn** — ASGI server that runs FastAPI
- **Google Gemini API** — AI assistant (RAG pattern)

## Project Structure

```
backend-fastapi/
├── main.py           # All API endpoints (routes)
├── models.py         # Database tables + request schemas
├── ai_service.py     # AI chat logic (RAG + Gemini API)
├── seed.py           # Populates database with sample data
├── requirements.txt  # Python dependencies
├── .env              # API keys (not committed)
└── smartsupply.db    # SQLite database file (auto-generated)
```

## Quick Start

### 1. Create virtual environment

```bash
cd backend-fastapi
python -m venv .venv
```

### 2. Activate virtual environment

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file:

```
GEMINI_API_KEY=your-google-gemini-api-key
```

Get a key at: https://aistudio.google.com/apikey

### 5. Seed the database (optional)

```bash
python seed.py
```

Creates sample data: 20 products, 5 suppliers, 4 warehouses, ~51 inventory records.

### 6. Run the server

```bash
python main.py
```

Server starts at `http://localhost:8000`

## API Documentation

Open **http://localhost:8000/docs** for interactive Swagger UI.

You can test every endpoint directly from the browser.

## API Endpoints

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products/` | List all products |
| GET | `/api/products/?search=bolt` | Search by name |
| POST | `/api/products/` | Create product |
| GET | `/api/products/{id}` | Get one product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |

### Warehouses
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/warehouses/` | List all |
| POST | `/api/warehouses/` | Create |
| GET | `/api/warehouses/{id}` | Get one |
| PUT | `/api/warehouses/{id}` | Update |
| DELETE | `/api/warehouses/{id}` | Delete |

### Suppliers
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/suppliers/` | List all |
| POST | `/api/suppliers/` | Create |
| GET | `/api/suppliers/{id}` | Get one |
| PUT | `/api/suppliers/{id}` | Update |
| DELETE | `/api/suppliers/{id}` | Delete |

### Inventory
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/inventory/` | List all inventory items |
| GET | `/api/inventory/?warehouse=3` | Filter by warehouse |
| POST | `/api/inventory/` | Create inventory record |
| GET | `/api/inventory/{id}` | Get one |
| DELETE | `/api/inventory/{id}` | Delete |
| **POST** | **`/api/inventory/{id}/adjust/`** | **Adjust stock quantity** |

### Inventory Movements (read-only audit log)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/inventory-movements/` | List all movements |

### AI Chat
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/ai/chat/` | Ask the AI assistant |

## Example Requests

### Create a product
```json
POST /api/products/
{
    "sku": "BOLT-M10",
    "name": "Bolt M10x50",
    "category": "Fasteners",
    "price": 0.50,
    "safety_stock": 200
}
```

### Adjust stock
```json
POST /api/inventory/1/adjust/
{
    "new_quantity": 100,
    "reason": "Inventory count correction"
}
```

### Ask the AI
```json
POST /api/ai/chat/
{
    "message": "Which products are low on stock?"
}
```

## How the AI Works (RAG Pattern)

1. User sends a question
2. `_build_context()` queries ALL data from the database and formats it as text
3. The text + question are combined into a prompt
4. Prompt is sent to Google Gemini API
5. Gemini reads the data and generates an answer
6. Answer is returned to the user

This is a simple RAG (Retrieval-Augmented Generation) approach — no vector database needed for small datasets.
