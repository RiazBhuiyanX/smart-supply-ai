"""
SmartSupply API — FastAPI version.

Как да пуснеш:
    cd backend-fastapi
    pip install -r requirements.txt
    python main.py

Отвори http://localhost:8000/docs за интерактивна документация.

Какво е FastAPI:
    Библиотека за създаване на REST API-та в Python.
    Всеки endpoint е ОБИКНОВЕНА ФУНКЦИЯ с декоратор (@app.get, @app.post...).
    Виждаш всичко — няма скрита магия.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime
from dotenv import load_dotenv

# Зареждаме .env файла (там е GEMINI_API_KEY)
load_dotenv()

# Импортираме от нашите файлове
from models import (
    get_session,
    create_tables,
    Product,
    Warehouse,
    Supplier,
    InventoryItem,
    InventoryMovement,
    ProductCreate,
    WarehouseCreate,
    SupplierCreate,
    InventoryItemCreate,
    StockAdjustment,
    ChatMessage,
    MovementType,
)

# ══════════════════════════════════════════════════
# СЪЗДАВАНЕ НА ПРИЛОЖЕНИЕТО
# ══════════════════════════════════════════════════

# Това е цялото ти приложение. Един ред.
app = FastAPI(title="SmartSupply API")

# CORS — позволява на frontend (React) да праща заявки към този сървър.
# Без това, браузърът блокира заявките заради security policy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Позволи от всякъде (за дев среда)
    allow_methods=["*"],  # Позволи GET, POST, PUT, DELETE...
    allow_headers=["*"],  # Позволи всякакви headers
)


@app.on_event("startup")
def startup():
    """Изпълнява се ВЕДНЪЖ когато сървърът стартира. Създава таблиците."""
    create_tables()


# ══════════════════════════════════════════════════════════════════════
# PRODUCTS — Пълен CRUD (Create, Read, Update, Delete)
#
# Това е шаблонът. Warehouses и Suppliers следват СЪЩИЯ модел.
# ══════════════════════════════════════════════════════════════════════


@app.get("/api/products/")
def list_products(search: str | None = None, session: Session = Depends(get_session)):
    """
    GET /api/products/          → връща всички продукти
    GET /api/products/?search=bolt → филтрира по име

    Как работи ред по ред:
    1. search: str | None = None → URL параметър, незадължителен
       Пример: /api/products/?search=болт
    2. session: Session = Depends(get_session) → FastAPI автоматично
       отваря DB връзка и я затваря след заявката
    3. select(Product) → SQL: SELECT * FROM products
    4. .where() → SQL: WHERE name LIKE '%bolt%'
    5. session.exec() → изпълни SQL заявката
    6. .all() → върни всички резултати като Python списък
    7. return → FastAPI автоматично конвертира списъка в JSON
    """
    query = select(Product).order_by(Product.created_at.desc())
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
        # ilike = case-insensitive LIKE → "bolt" ще намери "Bolt M10"
    products = session.exec(query).all()
    return products


@app.post("/api/products/", status_code=201)
def create_product(data: ProductCreate, session: Session = Depends(get_session)):
    """
    POST /api/products/
    Body: {"sku": "P001", "name": "Bolt M10", "price": 2.50}

    Как работи:
    1. data: ProductCreate → FastAPI чете JSON от body-то на заявката
       и проверява дали полетата съвпадат с ProductCreate класа.
       Ако sku липсва → автоматично връща 422 Validation Error.
    2. data.model_dump() → конвертира обекта в dict: {"sku": "P001", "name": "Bolt M10", ...}
    3. Product(**dict) → създава Product обект: Product(sku="P001", name="Bolt M10", ...)
       ** разпакетира dict-а в keyword arguments.
    4. session.add() → казва на SQLAlchemy "запиши това в базата"
    5. session.commit() → НАИСТИНА записва (без commit нищо не се записва)
    6. session.refresh() → презарежда от базата (сега product.id е попълнен)
    """
    product = Product(**data.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@app.get("/api/products/{product_id}")
def get_product(product_id: int, session: Session = Depends(get_session)):
    """
    GET /api/products/5 → връща продукт с id=5

    {product_id} е path параметър. FastAPI го извлича от URL-а.
    session.get(Product, 5) → SQL: SELECT * FROM products WHERE id = 5
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/api/products/{product_id}")
def update_product(
    product_id: int,
    data: ProductCreate,
    session: Session = Depends(get_session),
):
    """
    PUT /api/products/5
    Body: {"sku": "P001", "name": "Updated Bolt", "price": 3.00}

    setattr(product, "name", "Updated Bolt") е същото като product.name = "Updated Bolt"
    Използваме setattr в цикъл, за да не пишем ръчно всяко поле.
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in data.model_dump().items():
        setattr(product, key, value)
    product.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(product)
    return product


@app.delete("/api/products/{product_id}", status_code=204)
def delete_product(product_id: int, session: Session = Depends(get_session)):
    """
    DELETE /api/products/5 → изтрива продукт с id=5
    status_code=204 → "No Content" (успешно изтрит, без body в отговора)
    """
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    session.delete(product)
    session.commit()


# ══════════════════════════════════════════════════
# WAREHOUSES — Същият CRUD шаблон
# ══════════════════════════════════════════════════


@app.get("/api/warehouses/")
def list_warehouses(session: Session = Depends(get_session)):
    return session.exec(select(Warehouse)).all()


@app.post("/api/warehouses/", status_code=201)
def create_warehouse(data: WarehouseCreate, session: Session = Depends(get_session)):
    warehouse = Warehouse(**data.model_dump())
    session.add(warehouse)
    session.commit()
    session.refresh(warehouse)
    return warehouse


@app.get("/api/warehouses/{warehouse_id}")
def get_warehouse(warehouse_id: int, session: Session = Depends(get_session)):
    warehouse = session.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse


@app.put("/api/warehouses/{warehouse_id}")
def update_warehouse(
    warehouse_id: int,
    data: WarehouseCreate,
    session: Session = Depends(get_session),
):
    warehouse = session.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for key, value in data.model_dump().items():
        setattr(warehouse, key, value)
    session.commit()
    session.refresh(warehouse)
    return warehouse


@app.delete("/api/warehouses/{warehouse_id}", status_code=204)
def delete_warehouse(warehouse_id: int, session: Session = Depends(get_session)):
    warehouse = session.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    session.delete(warehouse)
    session.commit()


# ══════════════════════════════════════════════════
# SUPPLIERS — Същият CRUD шаблон
# ══════════════════════════════════════════════════


@app.get("/api/suppliers/")
def list_suppliers(session: Session = Depends(get_session)):
    return session.exec(select(Supplier)).all()


@app.post("/api/suppliers/", status_code=201)
def create_supplier(data: SupplierCreate, session: Session = Depends(get_session)):
    supplier = Supplier(**data.model_dump())
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier


@app.get("/api/suppliers/{supplier_id}")
def get_supplier(supplier_id: int, session: Session = Depends(get_session)):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@app.put("/api/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    data: SupplierCreate,
    session: Session = Depends(get_session),
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in data.model_dump().items():
        setattr(supplier, key, value)
    session.commit()
    session.refresh(supplier)
    return supplier


@app.delete("/api/suppliers/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, session: Session = Depends(get_session)):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    session.delete(supplier)
    session.commit()


# ══════════════════════════════════════════════════════════════
# INVENTORY — CRUD + adjust_stock (основната бизнес логика)
# ══════════════════════════════════════════════════════════════


@app.get("/api/inventory/")
def list_inventory(
    warehouse: int | None = None,
    search: str | None = None,
    session: Session = Depends(get_session),
):
    """
    GET /api/inventory/             → всички записи
    GET /api/inventory/?warehouse=3 → филтрирани по склад

    Тук ръчно "сглобяваме" JSON отговора, защото искаме вложени
    (nested) данни за продукта и склада — не само техните ID-та.
    """
    query = select(InventoryItem)
    if warehouse:
        query = query.where(InventoryItem.warehouse_id == warehouse)
    items = session.exec(query).all()

    result = []
    for item in items:
        # Зареждаме свързания продукт и склад по техните ID-та
        product = session.get(Product, item.product_id)
        wh = session.get(Warehouse, item.warehouse_id)

        # Ако има search параметър, пропускаме несъвпадащите
        if search and product and search.lower() not in product.name.lower():
            continue

        result.append(
            {
                "id": item.id,
                "quantity": item.quantity,
                "reserved": item.reserved,
                "available": item.quantity - item.reserved,
                "last_updated": item.last_updated,
                "product": (
                    {
                        "id": product.id,
                        "sku": product.sku,
                        "name": product.name,
                        "price": product.price,
                    }
                    if product
                    else None
                ),
                "warehouse": (
                    {
                        "id": wh.id,
                        "name": wh.name,
                        "location": wh.location,
                    }
                    if wh
                    else None
                ),
            }
        )
    return result


@app.post("/api/inventory/", status_code=201)
def create_inventory_item(
    data: InventoryItemCreate,
    session: Session = Depends(get_session),
):
    item = InventoryItem(**data.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@app.get("/api/inventory/{item_id}")
def get_inventory_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    product = session.get(Product, item.product_id)
    wh = session.get(Warehouse, item.warehouse_id)
    return {
        "id": item.id,
        "quantity": item.quantity,
        "reserved": item.reserved,
        "available": item.quantity - item.reserved,
        "product": (
            {"id": product.id, "sku": product.sku, "name": product.name}
            if product
            else None
        ),
        "warehouse": {"id": wh.id, "name": wh.name} if wh else None,
    }


@app.delete("/api/inventory/{item_id}", status_code=204)
def delete_inventory_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    session.delete(item)
    session.commit()


@app.post("/api/inventory/{item_id}/adjust/")
def adjust_stock(
    item_id: int,
    data: StockAdjustment,
    session: Session = Depends(get_session),
):
    """
    POST /api/inventory/5/adjust/
    Body: {"new_quantity": 100, "reason": "Преброени 100 броя"}

    ══════════════════════════════════════════════════════
    ТОВА Е ОСНОВНАТА БИЗНЕС ЛОГИКА НА ПРИЛОЖЕНИЕТО.
    ══════════════════════════════════════════════════════

    Какво прави стъпка по стъпка:

    1. НАМЕРИ inventory item-а (продукт X в склад Y)
    2. ИЗЧИСЛИ разликата:
       - Било: 80 броя, ново: 100 → разлика = +20 (стока ВЛИЗА)
       - Било: 80 броя, ново: 50  → разлика = -30 (стока ИЗЛИЗА)
    3. ЗАПИШИ промяната в лога (inventory_movements)
       Този запис НИКОГА не се изтрива — служи за одит
    4. ПРОМЕНИ количеството в inventory_items
    5. ВЪРНИ обновените данни

    Защо е важно: ако някой попита "защо количеството се е променило",
    можеш да погледнеш в movements и да видиш кой, кога и защо го е направил.
    """

    # Стъпка 1: Намери item-а
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Стъпка 2: Изчисли разликата
    old_quantity = item.quantity
    new_quantity = data.new_quantity
    difference = new_quantity - old_quantity

    # Стъпка 3: Запиши в лога
    # Ако difference >= 0 → стока ВЛИЗА (IN), иначе ИЗЛИЗА (OUT)
    movement = InventoryMovement(
        inventory_item_id=item.id,
        movement_type=MovementType.IN if difference >= 0 else MovementType.OUT,
        quantity=abs(difference),  # abs() = абсолютна стойност (-30 → 30)
        quantity_before=old_quantity,
        quantity_after=new_quantity,
        reason=data.reason,
        reference_type="MANUAL_ADJUSTMENT",
    )
    session.add(movement)

    # Стъпка 4: Промени количеството
    item.quantity = new_quantity
    item.last_updated = datetime.utcnow()

    # commit() записва И movement-а И промяната на item.quantity
    # Ако нещо се счупи преди commit → нищо не се записва (всичко или нищо)
    session.commit()
    session.refresh(item)

    # Стъпка 5: Върни обновените данни
    product = session.get(Product, item.product_id)
    wh = session.get(Warehouse, item.warehouse_id)
    return {
        "id": item.id,
        "quantity": item.quantity,
        "reserved": item.reserved,
        "available": item.quantity - item.reserved,
        "product": {"id": product.id, "name": product.name} if product else None,
        "warehouse": {"id": wh.id, "name": wh.name} if wh else None,
    }


# ══════════════════════════════════════════════════
# MOVEMENTS — Само четене (read-only одит лог)
# ══════════════════════════════════════════════════


@app.get("/api/inventory-movements/")
def list_movements(session: Session = Depends(get_session)):
    """Връща последните промени в инвентара, най-новите отгоре."""
    movements = session.exec(
        select(InventoryMovement).order_by(InventoryMovement.created_at.desc())
    ).all()

    result = []
    for m in movements:
        item = session.get(InventoryItem, m.inventory_item_id)
        product = session.get(Product, item.product_id) if item else None
        result.append(
            {
                "id": m.id,
                "movement_type": m.movement_type,
                "quantity": m.quantity,
                "quantity_before": m.quantity_before,
                "quantity_after": m.quantity_after,
                "reason": m.reason,
                "created_at": m.created_at,
                "product_name": product.name if product else "Unknown",
            }
        )
    return result


# ══════════════════════════════════════════════════
# AI CHAT — Изпраща въпрос + данни от базата към Gemini
# ══════════════════════════════════════════════════


@app.post("/api/ai/chat/")
def ai_chat(data: ChatMessage, session: Session = Depends(get_session)):
    """
    POST /api/ai/chat/
    Body: {"message": "Кои продукти са с ниско количество?"}

    1. Взимаме message от JSON body-то
    2. Подаваме го на ai_service.generate_response()
    3. AI сервизът чете базата данни, пита Gemini, връща отговор
    4. Връщаме отговора като JSON
    """
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    from ai_service import generate_response

    response = generate_response(data.message, session)
    return {"response": response}


# ══════════════════════════════════════════════════
# СТАРТИРАНЕ НА СЪРВЪРА
# ══════════════════════════════════════════════════

if __name__ == "__main__":
    # Това се изпълнява когато пуснеш: python main.py
    # uvicorn е сървърът, който обслужва FastAPI приложението
    # reload=True → автоматично рестартира при промяна на файл
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
