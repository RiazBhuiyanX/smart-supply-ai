"""
AI Service — The brain of the AI assistant.

THIS IS YOUR AiService.java REWRITTEN IN PYTHON.

The RAG (Retrieval-Augmented Generation) pattern works like this:

    1. User asks: "Which products are low on stock?"
    2. build_context() → queries ALL data from the database
       and formats it as plain text (products, warehouses, inventory, etc.)
    3. The text context + user question → sent to Gemini API
    4. Gemini reads the context and answers based on REAL data
    5. Response sent back to user

WHY THIS APPROACH?
    - Simple: No vector database, no embeddings, no complex pipeline
    - Works great for SMALL datasets (hundreds of products, not millions)
    - Every query gets FRESH data (no stale cache)

    TRADE-OFF: For millions of rows, you'd use proper RAG with embeddings.
    But for an ERP with a few hundred products? This is perfect.

JAVA → PYTHON MAPPING:
    - @Service → just a regular Python module with functions
    - @Autowired repositories → Django ORM queries (Model.objects.all())
    - RestTemplate → requests library
    - StringBuilder → Python f-strings and join()
    - @Value("${gemini.api-key}") → os.getenv("GEMINI_API_KEY")
    - stream().mapToInt().sum() → sum(item.quantity for item in items)
    - Collectors.groupingBy() → defaultdict or itertools.groupby
"""

import os
import logging
import requests
from collections import defaultdict

from .models import Product, Warehouse, Supplier, InventoryItem, InventoryMovement

# Logger — like Lombok's @Slf4j in Java
logger = logging.getLogger(__name__)

# Gemini API URL — same as your Java constant
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-lite:generateContent"
)


def generate_response(user_message: str) -> str:
    """
    Main entry point — like your AiService.generateResponse() method.

    JAVA EQUIVALENT:
        public String generateResponse(String userMessage) {
            String context = buildContext();
            String systemPrompt = "You are SmartSupply Assistant..." + context;
            return callGeminiApi(systemPrompt, userMessage);
        }

    PYTHON VERSION:
        Same logic, just different syntax.
    """
    try:
        # Step 1: Build context from database
        context = _build_context()

        # Step 2: Create the system prompt (instructions + data)
        system_prompt = (
            "You are SmartSupply Assistant, an AI expert in supply chain management. "
            "Use the provided database context to answer the user's question. "
            "You SHOULD aggregate, summarize, and count data when asked "
            "(e.g., 'total inventory', 'how many products'). "
            "If the answer is not in the data, say you don't know. "
            "Be concise but informative. Format money as EUR (€). "
            "\n\nDATA CONTEXT:\n" + context
        )

        # Step 3: Call the Gemini API
        return _call_gemini_api(system_prompt, user_message)

    except Exception as e:
        logger.error("Critical Error in AI Service: %s", e, exc_info=True)
        return f"I am experiencing technical difficulties. Error: {e}"


def _build_context() -> str:
    """
    Builds a text snapshot of the entire database.

    JAVA EQUIVALENT: private String buildContext() { StringBuilder sb = ... }

    This is the "Retrieval" part of RAG.
    We query every table and format the data as human-readable text.
    Then Gemini can read this text and answer questions about it.

    PYTHON vs JAVA differences:
        - No StringBuilder — Python uses list of strings + "\\n".join()
        - No stream().mapToInt() — Python uses sum(x.field for x in items)
        - No Collectors.groupingBy() — Python uses defaultdict
    """
    lines = []

    # ---- PRODUCTS ----
    # Java: List<Product> products = productRepository.findAll();
    # Django: Product.objects.all() — same thing, different syntax
    products = Product.objects.all()
    lines.append(f"PRODUCTS (Total: {products.count()}):")
    for p in products:
        lines.append(
            f"- {p.name} (SKU: {p.sku}, Price: {p.price:.2f}, "
            f"Category: {p.category}, Safety Stock: {p.safety_stock})"
        )
    lines.append("")

    # ---- WAREHOUSES ----
    warehouses = Warehouse.objects.all()
    lines.append(f"WAREHOUSES (Total: {warehouses.count()}):")
    for w in warehouses:
        lines.append(f"- {w.name} ({w.location})")
    lines.append("")

    # ---- INVENTORY SUMMARY ----
    # Java: inventory.stream().mapToInt(InventoryItem::getQuantity).sum()
    # Python: sum(item.quantity for item in inventory)
    #   This is called a "generator expression" — like Java streams but shorter
    inventory = InventoryItem.objects.select_related("product", "warehouse").all()

    total_quantity = sum(item.quantity for item in inventory)
    total_value = sum(item.quantity * float(item.product.price) for item in inventory)

    lines.append(
        f"INVENTORY SUMMARY: Total Items: {total_quantity}, Total Value: {total_value:.2f} EUR"
    )

    # ---- MOST STOCKED PRODUCT ----
    # Java: Collectors.groupingBy(i -> i.getProduct().getName(), Collectors.summingInt(...))
    # Python: defaultdict — a dict that auto-creates missing keys with a default value
    product_stock = defaultdict(
        int
    )  # Like HashMap<String, Integer> but auto-initializes to 0
    for item in inventory:
        product_stock[item.product.name] += item.quantity

    if product_stock:
        # max() with key= finds the entry with highest value
        # Java: .entrySet().stream().max(Map.Entry.comparingByValue())
        most_stocked_name = max(product_stock, key=product_stock.get)
        lines.append(
            f"MOST STOCKED PRODUCT: {most_stocked_name} "
            f"(Total Quantity: {product_stock[most_stocked_name]})"
        )
    lines.append("")

    # ---- INVENTORY DETAILS (with low stock warnings) ----
    lines.append("INVENTORY DETAILS (By Warehouse):")
    # Sort by quantity descending — same as your Java: sorted((a,b) -> b.getQuantity().compareTo(a.getQuantity()))
    sorted_inventory = sorted(inventory, key=lambda item: item.quantity, reverse=True)
    for item in sorted_inventory:
        low_stock = (
            " [LOW STOCK WARNING]" if item.quantity <= item.product.safety_stock else ""
        )
        lines.append(
            f"- Product: {item.product.name}, Warehouse: {item.warehouse.name}, "
            f"Quantity: {item.quantity}{low_stock}"
        )
    lines.append("")

    # ---- SUPPLIERS ----
    suppliers = Supplier.objects.all()
    lines.append(f"SUPPLIERS (Total: {suppliers.count()}):")
    for s in suppliers:
        lines.append(f"- {s.name} (Contact: {s.contact_person}, Email: {s.email})")
    lines.append("")

    # ---- RECENT MOVEMENTS ----
    # Limit to last 100 movements (don't dump 756 rows to the LLM)
    movements = InventoryMovement.objects.select_related(
        "inventory_item__product", "inventory_item__warehouse"
    ).order_by("-created_at")[:100]
    lines.append("RECENT INVENTORY MOVEMENTS (Last 100):")
    for m in movements:
        lines.append(
            f"- {m.created_at}: {m.movement_type} {m.quantity} units of "
            f"{m.inventory_item.product.name} at {m.inventory_item.warehouse.name} "
            f"(Reason: {m.reason})"
        )

    return "\n".join(lines)


def _call_gemini_api(system_prompt: str, user_message: str) -> str:
    """
    Calls the Google Gemini API.

    JAVA EQUIVALENT: private String callGeminiApi(String systemPrompt, String userMessage)

    JAVA used:
        - RestTemplate.exchange() with HttpEntity and HttpHeaders
        - Manual HashMap construction for the JSON body
        - Manual response parsing with casting

    PYTHON uses:
        - requests.post() — much simpler, no HttpEntity/HttpHeaders needed
        - Python dicts ARE JSON — no need for HashMap
        - response.json() auto-parses the response

    THE GEMINI API expects this JSON structure:
        {
            "contents": [
                {
                    "parts": [
                        { "text": "system prompt + user question" }
                    ]
                }
            ]
        }

    And returns:
        {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            { "text": "The AI's answer" }
                        ]
                    }
                }
            ]
        }
    """

    # Get API key from environment (like @Value("${gemini.api-key}") in Java)
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable is not set."

    # Combine system prompt + user message (same as Java)
    combined_prompt = f"{system_prompt}\n\nUSER QUESTION: {user_message}"

    # Build request body — in Python, a dict IS JSON
    # Java needed: Map<String, Object> requestBody = new HashMap<>();
    # Python: just write the dict directly
    request_body = {"contents": [{"parts": [{"text": combined_prompt}]}]}

    # Make the API call
    # Java: restTemplate.exchange(URL, POST, entity, typeRef)
    # Python: requests.post(URL, json=body) — that's it. Much simpler.
    response = requests.post(
        f"{GEMINI_API_URL}?key={api_key}",
        json=request_body,  # 'json=' auto-sets Content-Type: application/json
        timeout=30,  # 30 second timeout (good practice)
    )

    # Check if request was successful
    # Java: response.getBody() != null
    # Python: response.raise_for_status() throws on 4xx/5xx
    response.raise_for_status()

    # Parse the response
    # Java: lots of casting — (List<Map<String, Object>>) responseBody.get("candidates")
    # Python: just chain dict access — data["candidates"][0]["content"]["parts"][0]["text"]
    data = response.json()

    candidates = data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        if parts:
            return parts[0].get("text", "I couldn't generate a response.")

    return "I'm sorry, I couldn't understand that."
