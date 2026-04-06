"""
Database setup + Models.

Какво прави този файл:
    Дефинира КАКВО се съхранява в базата данни.
    Всеки клас = една таблица. Всяко поле = една колона.

Какво е SQLModel:
    Библиотека, която комбинира две неща:
    1. Описва таблиците в базата данни (SQLAlchemy)
    2. Валидира JSON данни от API заявки (Pydantic)
    Един клас прави и двете.
"""

from sqlmodel import SQLModel, Field, create_engine, Session
from datetime import datetime
from enum import Enum


# ══════════════════════════════════════════════════
# DATABASE CONNECTION
# ══════════════════════════════════════════════════

# SQLite = файл-базирана база данни. Цялата база е в ЕДИН файл.
# Не трябва да инсталираш или пускаш сървър (като PostgreSQL).
# За продакшън се сменя с PostgreSQL, но за разработка SQLite е перфектен.
DATABASE_URL = "sqlite:///smartsupply.db"

# engine = връзката към базата данни.
# Мисли за него като "тунел" между Python програмата и файла smartsupply.db.
engine = create_engine(DATABASE_URL)


def get_session():
    """
    Отваря сесия (връзка) към базата данни.

    yield означава: създай сесия → дай я на функцията → затвори я след това.
    Това гарантира, че връзката винаги се затваря, дори при грешка.
    """
    with Session(engine) as session:
        yield session


def create_tables():
    """Създава всички таблици (ако не съществуват)."""
    SQLModel.metadata.create_all(engine)


# ══════════════════════════════════════════════════
# ENUMS — фиксиран набор от допустими стойности
# ══════════════════════════════════════════════════


class WarehouseType(str, Enum):
    PHYSICAL = "PHYSICAL"
    VIRTUAL = "VIRTUAL"


class MovementType(str, Enum):
    IN = "IN"  # Стока влиза
    OUT = "OUT"  # Стока излиза
    ADJUSTMENT = "ADJUSTMENT"  # Корекция
    TRANSFER = "TRANSFER"  # Трансфер между складове


# ══════════════════════════════════════════════════
# DATABASE TABLES
# ══════════════════════════════════════════════════
#
# table=True казва на SQLModel: "създай таблица в базата за този клас"
# Без table=True, класът е просто валидатор за JSON данни.


class Product(SQLModel, table=True):
    """Таблица products — продуктите, които управлявате."""

    __tablename__ = "products"

    id: int | None = Field(default=None, primary_key=True)
    # id е автоматично — при INSERT базата го генерира (1, 2, 3...)
    # int | None означава "може да е число или None (празно)"
    # При създаване е None, след запис базата го попълва.

    sku: str = Field(unique=True, max_length=100)
    # unique=True = не може две стоки да имат един и същи SKU

    name: str = Field(max_length=255)
    category: str = Field(default="", max_length=100)
    price: float = Field(default=0)
    safety_stock: int = Field(default=0)
    # safety_stock = минимално ниво. Под него → предупреждение "LOW STOCK"

    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(default_factory=datetime.utcnow)
    # default_factory=datetime.utcnow → автоматично записва текущото време


class Warehouse(SQLModel, table=True):
    """Таблица warehouses — складовете, където се съхранява стоката."""

    __tablename__ = "warehouses"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    location: str = Field(default="", max_length=255)
    type: WarehouseType = Field(default=WarehouseType.PHYSICAL)
    capacity: int = Field(default=10000)


class Supplier(SQLModel, table=True):
    """Таблица suppliers — доставчиците, от които купувате."""

    __tablename__ = "suppliers"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str = Field(default="", max_length=50)
    address: str = Field(default="")
    contact_person: str = Field(default="", max_length=255)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


class InventoryItem(SQLModel, table=True):
    """
    Таблица inventory_items — КОЛКО от всеки продукт има във всеки склад.

    Това е "pivot" таблица — свързва Product и Warehouse.
    Пример: "Болт M10" в "Склад София" → количество: 500
    """

    __tablename__ = "inventory_items"

    id: int | None = Field(default=None, primary_key=True)

    product_id: int = Field(foreign_key="products.id")
    # foreign_key = "тази колона сочи към id в таблица products"
    # Ако изтриеш продукта, всички inventory_items за него също се изтриват.

    warehouse_id: int = Field(foreign_key="warehouses.id")

    quantity: int = Field(default=0)  # Колко броя са на склад
    reserved: int = Field(default=0)  # Колко са резервирани (за поръчки)
    last_updated: datetime | None = Field(default_factory=datetime.utcnow)


class InventoryMovement(SQLModel, table=True):
    """
    Таблица inventory_movements — ЛОГ на всяка промяна в количествата.

    Тази таблица е APPEND-ONLY: само се добавят нови редове, никога не се
    изтриват или редактират. Служи като audit trail (дневник за проверка).

    Пример запис: "На 05.04, Болт M10 в Склад София, количество от 500 → 600,
                    причина: Доставка от Доставчик X"
    """

    __tablename__ = "inventory_movements"

    id: int | None = Field(default=None, primary_key=True)
    inventory_item_id: int = Field(foreign_key="inventory_items.id")
    movement_type: MovementType
    quantity: int  # Колко броя са преместени
    quantity_before: int = 0  # Количество ПРЕДИ промяната
    quantity_after: int = 0  # Количество СЛЕД промяната
    reason: str = Field(default="", max_length=500)
    reference_type: str = Field(default="", max_length=50)
    reference_id: str = Field(default="", max_length=255)
    performed_by: str | None = Field(default=None)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)


# ══════════════════════════════════════════════════
# REQUEST SCHEMAS — какъв JSON приема API-то
# ══════════════════════════════════════════════════
#
# Тези класове НЯМАТ table=True → не създават таблици.
# Те просто описват "какъв JSON очакваме от клиента".
# FastAPI автоматично проверява дали JSON-ът съвпада.
# Ако не съвпада → връща 422 Validation Error.


class ProductCreate(SQLModel):
    """JSON за създаване/редактиране на продукт."""

    sku: str
    name: str
    category: str = ""
    price: float = 0
    safety_stock: int = 0


class WarehouseCreate(SQLModel):
    """JSON за създаване/редактиране на склад."""

    name: str
    location: str = ""
    type: WarehouseType = WarehouseType.PHYSICAL
    capacity: int = 10000


class SupplierCreate(SQLModel):
    """JSON за създаване/редактиране на доставчик."""

    name: str
    email: str | None = None
    phone: str = ""
    address: str = ""
    contact_person: str = ""


class InventoryItemCreate(SQLModel):
    """JSON за създаване на inventory запис."""

    product_id: int
    warehouse_id: int
    quantity: int = 0
    reserved: int = 0


class StockAdjustment(SQLModel):
    """JSON за корекция на количество."""

    new_quantity: int = Field(ge=0)  # ge=0 означава "трябва да е >= 0"
    reason: str


class ChatMessage(SQLModel):
    """JSON за AI чат."""

    message: str
