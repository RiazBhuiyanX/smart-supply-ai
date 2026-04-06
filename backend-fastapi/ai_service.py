"""
AI Service — изпраща данни от базата + въпроса на потребителя към Google Gemini.

Как работи (RAG pattern):

    Потребител пита: "Кои продукти са с ниско количество?"
         ↓
    1. _build_context() → чете ВСИЧКИ данни от базата
       и ги форматира като текст (продукти, складове, количества...)
         ↓
    2. Комбинира текста с въпроса в един голям prompt
         ↓
    3. _call_gemini_api() → изпраща prompt-а към Google Gemini
         ↓
    4. Gemini чете данните и отговаря на въпроса
         ↓
    5. Връщаме отговора на потребителя

    Защо работи: Gemini не знае нищо за нашата база данни.
    Но когато му дадем данните като текст, той може да ги анализира
    и да отговори на въпроси за тях.
"""

import os
import logging
import requests
from collections import defaultdict
from sqlmodel import Session, select

from models import Product, Warehouse, Supplier, InventoryItem, InventoryMovement

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-lite:generateContent"
)


def generate_response(user_message: str, session: Session) -> str:
    """
    Главна функция. Извиква се от main.py когато потребител изпрати чат съобщение.

    Параметри:
        user_message: текстът, който потребителят е написал
        session: връзка към базата данни (подаден от FastAPI)
    """
    try:
        # Стъпка 1: Прочети всички данни от базата и ги форматирай като текст
        context = _build_context(session)

        # Стъпка 2: Създай инструкции за AI-я (system prompt)
        # Казваме му: "Ти си асистент, ето ти данните, отговори на въпроса"
        system_prompt = (
            "You are SmartSupply Assistant, an AI expert in supply chain management. "
            "Use the provided database context to answer the user's question. "
            "You SHOULD aggregate, summarize, and count data when asked "
            "(e.g., 'total inventory', 'how many products'). "
            "If the answer is not in the data, say you don't know. "
            "Be concise but informative. Format money as EUR (€). "
            "\n\nDATA CONTEXT:\n" + context
        )

        # Стъпка 3: Изпрати към Gemini API и върни отговора
        return _call_gemini_api(system_prompt, user_message)

    except Exception as e:
        logger.error("AI Service error: %s", e, exc_info=True)
        return f"Technical error: {e}"


def _build_context(session: Session) -> str:
    """
    Чете ВСИЧКИ данни от базата и ги форматира като текст.

    Това е "Retrieval" частта от RAG:
    R = Retrieval (извличане на данни)
    A = Augmented (добавяне на данните към prompt-а)
    G = Generation (Gemini генерира отговор)

    Връща string от ~30,000 символа с всички продукти, складове,
    количества, доставчици и последни движения.
    """
    lines = []

    # ── PRODUCTS ──
    products = session.exec(select(Product)).all()
    products_by_id = {p.id: p for p in products}
    # ^ Създаваме dict за бърз достъп по id: {1: Product(...), 2: Product(...), ...}

    lines.append(f"PRODUCTS (Total: {len(products)}):")
    for p in products:
        lines.append(
            f"- {p.name} (SKU: {p.sku}, Price: {p.price:.2f}, "
            f"Category: {p.category}, Safety Stock: {p.safety_stock})"
        )
    lines.append("")

    # ── WAREHOUSES ──
    warehouses = session.exec(select(Warehouse)).all()
    warehouses_by_id = {w.id: w for w in warehouses}

    lines.append(f"WAREHOUSES (Total: {len(warehouses)}):")
    for w in warehouses:
        lines.append(f"- {w.name} ({w.location})")
    lines.append("")

    # ── INVENTORY SUMMARY ──
    items = session.exec(select(InventoryItem)).all()

    # sum() с generator expression:
    # sum(item.quantity for item in items)
    #   = вземи item.quantity от всеки item, и ги сумирай
    #   Като SUM(quantity) в SQL
    total_quantity = sum(item.quantity for item in items)
    total_value = sum(
        item.quantity * products_by_id[item.product_id].price
        for item in items
        if item.product_id in products_by_id
    )

    lines.append(
        f"INVENTORY SUMMARY: Total Items: {total_quantity}, "
        f"Total Value: {total_value:.2f} EUR"
    )

    # ── MOST STOCKED PRODUCT ──
    # defaultdict(int) = dict, който автоматично добавя 0 за нов ключ
    # Нормален dict: ако product_stock["Bolt"] не съществува → KeyError
    # defaultdict(int): ако product_stock["Bolt"] не съществува → създава го с 0
    product_stock = defaultdict(int)
    for item in items:
        product = products_by_id.get(item.product_id)
        if product:
            product_stock[product.name] += item.quantity

    if product_stock:
        # max() с key= → намери ключа с най-голяма стойност
        most_stocked = max(product_stock, key=product_stock.get)
        lines.append(
            f"MOST STOCKED PRODUCT: {most_stocked} "
            f"(Total: {product_stock[most_stocked]})"
        )
    lines.append("")

    # ── INVENTORY DETAILS (с предупреждения за ниско количество) ──
    lines.append("INVENTORY DETAILS:")
    sorted_items = sorted(items, key=lambda x: x.quantity, reverse=True)
    # sorted() с key=lambda → сортирай по quantity, от най-голямото
    # lambda x: x.quantity е кратък запис за "вземи quantity от x"
    # reverse=True → низходящо (500, 200, 50, 10...)

    for item in sorted_items:
        product = products_by_id.get(item.product_id)
        warehouse = warehouses_by_id.get(item.warehouse_id)
        if product and warehouse:
            low = " [LOW STOCK]" if item.quantity <= product.safety_stock else ""
            lines.append(f"- {product.name} at {warehouse.name}: {item.quantity}{low}")
    lines.append("")

    # ── SUPPLIERS ──
    suppliers = session.exec(select(Supplier)).all()
    lines.append(f"SUPPLIERS (Total: {len(suppliers)}):")
    for s in suppliers:
        lines.append(f"- {s.name} (Contact: {s.contact_person}, Email: {s.email})")
    lines.append("")

    # ── RECENT MOVEMENTS ──
    movements = session.exec(
        select(InventoryMovement).order_by(InventoryMovement.created_at.desc())
    ).all()[:100]
    # [:100] = вземи само първите 100 (не искаме да пратим 756 реда на AI)

    lines.append("RECENT INVENTORY MOVEMENTS (Last 100):")
    for m in movements:
        item_for_m = next((i for i in items if i.id == m.inventory_item_id), None)
        product_name = "Unknown"
        warehouse_name = "Unknown"
        if item_for_m:
            p = products_by_id.get(item_for_m.product_id)
            w = warehouses_by_id.get(item_for_m.warehouse_id)
            product_name = p.name if p else "Unknown"
            warehouse_name = w.name if w else "Unknown"
        lines.append(
            f"- {m.created_at}: {m.movement_type} {m.quantity} units of "
            f"{product_name} at {warehouse_name} (Reason: {m.reason})"
        )

    # "\n".join(lines) = свързва всички редове с нов ред между тях
    # ["А", "Б", "В"] → "А\nБ\nВ"
    return "\n".join(lines)


def _call_gemini_api(system_prompt: str, user_message: str) -> str:
    """
    Изпраща prompt към Google Gemini API и връща отговора.

    Gemini API-то приема JSON в определен формат и връща JSON.
    Ние ползваме requests библиотеката за HTTP заявки.
    """

    # Четем API ключа от .env файла
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return "Error: GEMINI_API_KEY is not set in .env file."

    # Комбинираме system prompt + въпроса на потребителя
    combined_prompt = f"{system_prompt}\n\nUSER QUESTION: {user_message}"

    # Тялото на заявката — в точния формат, който Gemini API очаква
    request_body = {"contents": [{"parts": [{"text": combined_prompt}]}]}

    # Изпращаме POST заявка към Gemini
    # json=request_body → requests автоматично:
    #   1. Конвертира dict-а в JSON string
    #   2. Добавя header Content-Type: application/json
    response = requests.post(
        f"{GEMINI_API_URL}?key={api_key}",
        json=request_body,
        timeout=30,
    )

    # Ако сървърът върне грешка (4xx, 5xx) → хвърли exception
    response.raise_for_status()

    # Парсваме JSON отговора
    # Gemini връща:
    # {
    #   "candidates": [
    #     {
    #       "content": {
    #         "parts": [
    #           {"text": "Отговорът на AI тук..."}
    #         ]
    #       }
    #     }
    #   ]
    # }
    data = response.json()

    # Навигираме до текста на отговора
    # .get() е безопасен достъп — ако ключът не съществува, връща default
    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        if parts:
            return parts[0].get("text", "Couldn't generate a response.")

    return "Couldn't understand the response from Gemini."
