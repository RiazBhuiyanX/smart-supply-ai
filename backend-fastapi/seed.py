"""
Data seeder — пълни базата с примерни данни.

Как да пуснеш:
    python seed.py

Какво прави:
    Създава примерни продукти, складове, доставчици, inventory записи
    и движения. Използва се за тестване и демо.
"""

import random
from datetime import datetime
from sqlmodel import Session, select
from models import (
    engine,
    create_tables,
    Product,
    Warehouse,
    Supplier,
    InventoryItem,
    InventoryMovement,
    WarehouseType,
    MovementType,
)


def seed():
    """Основната функция — създава всички примерни данни."""

    create_tables()

    with Session(engine) as session:
        # Проверка дали вече има данни
        existing = session.exec(select(Product)).first()
        if existing:
            print("Database already has data. Skipping.")
            return

        # ── SUPPLIERS ──
        suppliers = [
            Supplier(
                name="ТехноСнаб ООД",
                email="info@tehnosnab.bg",
                phone="+359 2 111 2233",
                contact_person="Иван Петров",
            ),
            Supplier(
                name="БългарИнструмент АД",
                email="sales@bulgarinstrument.bg",
                phone="+359 32 444 555",
                contact_person="Мария Димитрова",
            ),
            Supplier(
                name="Метал Груп ЕООД",
                email="office@metalgroup.bg",
                phone="+359 42 666 777",
                contact_person="Георги Стоянов",
            ),
            Supplier(
                name="ЕлектроКомпонент ООД",
                email="orders@electrocomp.bg",
                phone="+359 56 888 999",
                contact_person="Елена Василева",
            ),
            Supplier(
                name="ХимТрейд БГ АД",
                email="contact@himtradebg.bg",
                phone="+359 62 333 444",
                contact_person="Стефан Николов",
            ),
        ]
        for s in suppliers:
            session.add(s)

        # ── WAREHOUSES ──
        warehouses = [
            Warehouse(
                name="Централен склад София",
                location="София, Промишлена зона",
                type=WarehouseType.PHYSICAL,
                capacity=50000,
            ),
            Warehouse(
                name="Склад Пловдив",
                location="Пловдив, Тракия",
                type=WarehouseType.PHYSICAL,
                capacity=30000,
            ),
            Warehouse(
                name="Склад Варна",
                location="Варна, ЗПЗ",
                type=WarehouseType.PHYSICAL,
                capacity=20000,
            ),
            Warehouse(
                name="Виртуален склад Транзит",
                location="",
                type=WarehouseType.VIRTUAL,
                capacity=100000,
            ),
        ]
        for w in warehouses:
            session.add(w)

        # ── PRODUCTS ──
        products_data = [
            ("BOLT-M10", "Болт M10x50", "Крепежни елементи", 0.50, 200),
            ("BOLT-M12", "Болт M12x60", "Крепежни елементи", 0.75, 150),
            ("NUT-M10", "Гайка M10", "Крепежни елементи", 0.30, 300),
            ("NUT-M12", "Гайка M12", "Крепежни елементи", 0.40, 250),
            ("WSHR-M10", "Шайба M10", "Крепежни елементи", 0.15, 500),
            ("PIPE-DN50", "Тръба DN50 стомана", "Тръби и фитинги", 12.50, 50),
            ("PIPE-DN100", "Тръба DN100 стомана", "Тръби и фитинги", 25.00, 30),
            ("ELBOW-DN50", "Коляно DN50 90°", "Тръби и фитинги", 8.00, 40),
            ("VALVE-DN50", "Кран топков DN50", "Тръби и фитинги", 35.00, 20),
            ("CABLE-2.5", "Кабел NYY 3x2.5", "Електро", 2.80, 100),
            ("CABLE-4.0", "Кабел NYY 3x4.0", "Електро", 4.20, 80),
            ("SWITCH-16A", "Прекъсвач 16A", "Електро", 6.50, 60),
            ("PAINT-WHT", "Боя бяла 10L", "Бои и покрития", 45.00, 15),
            ("PAINT-GRY", "Боя сива 10L", "Бои и покрития", 42.00, 15),
            ("CEMENT-25", "Цимент 25кг", "Строителни", 8.50, 100),
            ("SAND-25", "Пясък 25кг", "Строителни", 3.00, 200),
            ("GRAVEL-25", "Чакъл 25кг", "Строителни", 4.00, 150),
            ("DRILL-10", "Свредло Ø10 HSS", "Инструменти", 7.50, 30),
            ("GLOVES-L", "Ръкавици работни L", "Лични предпазни", 5.00, 100),
            ("HELMET-YLW", "Каска жълта", "Лични предпазни", 18.00, 25),
        ]

        products = []
        for sku, name, category, price, safety in products_data:
            p = Product(
                sku=sku, name=name, category=category, price=price, safety_stock=safety
            )
            session.add(p)
            products.append(p)

        # commit за да получим id-тата
        session.commit()

        # Презареждаме, за да имаме id-тата
        for p in products:
            session.refresh(p)
        for w in warehouses:
            session.refresh(w)

        # ── INVENTORY ITEMS ──
        items = []
        reasons_bg = [
            "Начално зареждане",
            "Доставка от доставчик",
            "Инвентаризация",
            "Корекция след проверка",
        ]

        for product in products:
            # Всеки продукт е в 2-3 склада с произволно количество
            num_warehouses = random.randint(2, min(3, len(warehouses)))
            selected_warehouses = random.sample(
                [w for w in warehouses if w.type == WarehouseType.PHYSICAL],
                min(num_warehouses, 3),
            )

            for wh in selected_warehouses:
                qty = random.randint(10, 500)
                item = InventoryItem(
                    product_id=product.id,
                    warehouse_id=wh.id,
                    quantity=qty,
                    reserved=random.randint(0, qty // 5),
                )
                session.add(item)
                items.append((item, qty))

        session.commit()

        # Презареждаме items за id-тата
        for item_tuple in items:
            session.refresh(item_tuple[0])

        # ── INVENTORY MOVEMENTS ──
        for item, qty in items:
            # Създаваме начално движение за всеки item
            movement = InventoryMovement(
                inventory_item_id=item.id,
                movement_type=MovementType.IN,
                quantity=qty,
                quantity_before=0,
                quantity_after=qty,
                reason=random.choice(reasons_bg),
                reference_type="INITIAL_STOCK",
            )
            session.add(movement)

        session.commit()

        # Статистика
        total_products = len(products)
        total_suppliers = len(suppliers)
        total_warehouses = len(warehouses)
        total_items = len(items)
        print(f"Seeded successfully!")
        print(f"  Products:    {total_products}")
        print(f"  Suppliers:   {total_suppliers}")
        print(f"  Warehouses:  {total_warehouses}")
        print(f"  Inv. Items:  {total_items}")
        print(f"  Movements:   {total_items}")


if __name__ == "__main__":
    seed()
