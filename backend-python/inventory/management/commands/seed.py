"""
Data Seeder — Django management command.

THIS IS LIKE YOUR DataSeeder.java (CommandLineRunner).

In Spring Boot:
    @Component @Profile("seed")
    public class DataSeeder implements CommandLineRunner { ... }
    Run with: mvn spring-boot:run -Dspring-boot.run.profiles=seed

In Django:
    This is a "management command" — a script you run via manage.py.
    Run with: python manage.py seed

    Django discovers this file because it's at:
    inventory/management/commands/seed.py

    The class MUST be called Command and extend BaseCommand.
"""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from inventory.models import (
    Product,
    Warehouse,
    Supplier,
    InventoryItem,
    InventoryMovement,
    WarehouseType,
    MovementType,
)


class Command(BaseCommand):
    """
    Like your DataSeeder class.
    BaseCommand = CommandLineRunner equivalent.
    self.stdout.write() = log.info() equivalent.
    """

    help = "Seed the database with Bulgarian-localized test data"

    def handle(self, *args, **options):
        """
        Like your run() method in CommandLineRunner.
        This is the entry point Django calls.
        """
        # Seed with fixed random for reproducible results (same as your Random(42))
        self.rng = random.Random(42)

        self.stdout.write("🌱 Starting data seeding (Bulgaria localized)...")

        self._clear_all_data()

        suppliers = self._seed_suppliers()
        products = self._seed_products()
        warehouses = self._seed_warehouses()
        inventory_items = self._seed_inventory_items(products, warehouses)
        self._seed_inventory_movements(inventory_items)

        self.stdout.write(self.style.SUCCESS("✅ Data seeding complete!"))
        self.stdout.write(f"   - {len(suppliers)} Suppliers")
        self.stdout.write(f"   - {len(products)} Products")
        self.stdout.write(f"   - {len(warehouses)} Warehouses")
        self.stdout.write(f"   - {len(inventory_items)} Inventory Items")

    def _clear_all_data(self):
        """
        Like your clearAllData() method.

        In Java you used raw SQL TRUNCATE CASCADE.
        In Django we just call .all().delete() on each model.
        Django handles CASCADE automatically via on_delete=models.CASCADE.

        Order matters: delete children before parents to avoid FK violations.
        """
        self.stdout.write("🗑️  Clearing existing data...")
        InventoryMovement.objects.all().delete()
        InventoryItem.objects.all().delete()
        Product.objects.all().delete()
        Supplier.objects.all().delete()
        Warehouse.objects.all().delete()
        self.stdout.write("✅ All tables cleared!")

    # ==================== SUPPLIERS (Bulgarian Companies) ====================

    def _seed_suppliers(self):
        """
        Like your seedSuppliers() method.

        In Java:  Supplier.builder().name("...").email("...").build();
        In Python: Supplier(name="...", email="...")

        bulk_create() = repository.saveAll() — inserts all rows in one query.
        """
        self.stdout.write("🏭 Seeding suppliers...")

        supplier_data = [
            (
                "Техномаркет България",
                "orders@technomarket.bg",
                "+359 2 962 1234",
                "бул. Цариградско шосе 115, София 1784",
                "Георги Иванов",
            ),
            (
                "Емаг България",
                "suppliers@emag.bg",
                "+359 2 489 5000",
                "бул. Ботевградско шосе 247, София 1517",
                "Мария Петрова",
            ),
            (
                "Офис 1 Суперстор",
                "info@office1.bg",
                "+359 2 981 8100",
                "ул. Околовръстен път 260, София 1766",
                "Александър Димитров",
            ),
            (
                "БГ Електроникс",
                "sales@bgelectronics.bg",
                "+359 32 625 123",
                "ул. Брезовско шосе 176, Пловдив 4000",
                "Николай Стоянов",
            ),
            (
                "Софтуни Хардуер",
                "hardware@softuni.bg",
                "+359 2 421 3030",
                "бул. България 102, София 1680",
                "Стефан Колев",
            ),
            (
                "Варна Компютри",
                "office@varnapc.bg",
                "+359 52 612 345",
                "бул. Владислав Варненчик 186, Варна 9000",
                "Елена Георгиева",
            ),
            (
                "Бургас Техника",
                "sales@burgastechnika.bg",
                "+359 56 842 678",
                "ул. Александровска 21, Бургас 8000",
                "Димитър Тодоров",
            ),
            (
                "Русе Компоненти",
                "info@rusecomponents.bg",
                "+359 82 831 456",
                "бул. Липник 117, Русе 7000",
                "Ивайло Николов",
            ),
            (
                "Пловдив Офис",
                "contact@plovdivoffice.bg",
                "+359 32 943 789",
                "ул. Капитан Райчо 56, Пловдив 4000",
                "Калина Атанасова",
            ),
            (
                "Стара Загора Дистрибуция",
                "orders@szd.bg",
                "+359 42 620 111",
                "ул. Индустриална 23, Стара Загора 6000",
                "Петър Василев",
            ),
            (
                "Балкан Електроникс",
                "sales@balkanelectronics.bg",
                "+359 2 818 2020",
                "бул. Симеоновско шосе 110, София 1700",
                "Веселин Христов",
            ),
            (
                "Черноморски Доставки",
                "logistics@blacksea-supply.bg",
                "+359 52 300 400",
                "Промишлена зона Запад, Варна 9000",
                "Росица Маринова",
            ),
        ]

        suppliers = Supplier.objects.bulk_create(
            [
                Supplier(
                    name=name,
                    email=email,
                    phone=phone,
                    address=address,
                    contact_person=contact_person,
                )
                for name, email, phone, address, contact_person in supplier_data
            ]
        )
        return suppliers

    # ==================== PRODUCTS ====================

    def _seed_products(self):
        """
        Like your seedProducts() method.

        In Java you used createProductCategory() helper.
        In Python we use a dict of category → list of (sku, name, price, safety_stock).
        """
        self.stdout.write("📦 Seeding products...")

        # Same product data as your Java seeder, organized by category
        categories = {
            "Електроника": [
                ("ELEC-001", "Лаптоп Lenovo ThinkPad", "1280.00", 30),
                ("ELEC-002", "Безжична мишка Logitech", "30.00", 200),
                ("ELEC-003", "Механична клавиатура", "140.00", 80),
                ("ELEC-004", 'Монитор 27" 4K Samsung', "460.00", 50),
                ("ELEC-005", "USB-C Hub 7-Port", "45.00", 150),
                ("ELEC-006", "Уеб камера HD 1080p", "75.00", 100),
                ("ELEC-007", "Bluetooth слушалки Sony", "180.00", 60),
                ("ELEC-008", "Външен SSD 1TB Samsung", "100.00", 90),
                ("ELEC-009", "Смарт колонка Google", "90.00", 70),
                ("ELEC-010", "Безжично зарядно", "35.00", 180),
            ],
            "Компоненти": [
                ("COMP-001", "Процесор Intel Core i7-14700K", "410.00", 25),
                ("COMP-002", "Видеокарта RTX 4070 Super", "615.00", 20),
                ("COMP-003", "RAM памет DDR5 32GB", "125.00", 50),
                ("COMP-004", "Дънна платка Z790", "245.00", 35),
                ("COMP-005", "Захранване 850W Gold", "110.00", 45),
                ("COMP-006", "Водно охлаждане 360mm", "150.00", 30),
                ("COMP-007", "NVMe SSD 2TB", "150.00", 60),
                ("COMP-008", "Кутия за PC Full Tower", "125.00", 25),
                ("COMP-009", "RGB вентилатори 3 бр.", "45.00", 100),
                ("COMP-010", "Термо паста", "8.00", 300),
            ],
            "Офис консумативи": [
                ("OFFC-001", "Хартия А4 500 листа", "6.50", 500),
                ("OFFC-002", "Тонер касета черна HP", "45.00", 100),
                ("OFFC-003", "Тонер касета цветна HP", "65.00", 80),
                ("OFFC-004", "Телбод тежък", "20.00", 60),
                ("OFFC-005", "Органайзер за бюро", "25.00", 80),
                ("OFFC-006", "Бяла дъска 120x90", "75.00", 30),
                ("OFFC-007", "Маркери комплект 12 бр.", "12.00", 200),
                ("OFFC-008", "Тетрадки А5 5 бр.", "7.50", 300),
                ("OFFC-009", "Кламери 100 бр.", "2.50", 500),
                ("OFFC-010", "Самозалепващи листчета", "5.00", 400),
            ],
            "Мрежово оборудване": [
                ("NETW-001", "Рутер WiFi 6E TP-Link", "200.00", 40),
                ("NETW-002", "Мрежов суич 24-порта", "180.00", 25),
                ("NETW-003", "Ethernet кабел Cat6 15м", "15.00", 200),
                ("NETW-004", "Access Point Ubiquiti", "150.00", 35),
                ("NETW-005", "Пач панел 48-порта", "75.00", 20),
                ("NETW-006", "Мрежов шкаф 42U", "410.00", 10),
                ("NETW-007", "PoE инжектор 8-порта", "100.00", 30),
                ("NETW-008", "Оптичен кабел 100м", "125.00", 15),
                ("NETW-009", "Мрежов тестер", "60.00", 40),
                ("NETW-010", "Кабелен органайзер", "25.00", 100),
            ],
            "Офис мебели": [
                ("FURN-001", "Ергономичен офис стол", "300.00", 20),
                ("FURN-002", "Електрическо бюро 160см", "460.00", 15),
                ("FURN-003", "Стойка за монитор двойна", "75.00", 40),
                ("FURN-004", "LED настолна лампа", "40.00", 80),
                ("FURN-005", "Шкаф с 3 чекмеджета", "150.00", 25),
                ("FURN-006", "Етажерка за книги 5 рафта", "110.00", 30),
                ("FURN-007", "Заседателна маса 240см", "560.00", 8),
                ("FURN-008", "Посетителски стол", "110.00", 35),
                ("FURN-009", "Преграден параван", "180.00", 12),
                ("FURN-010", "Поставка за клавиатура", "45.00", 50),
            ],
        }

        products = []
        for category, items in categories.items():
            for sku, name, price, safety_stock in items:
                products.append(
                    Product(
                        sku=sku,
                        name=name,
                        category=category,
                        price=Decimal(price),
                        safety_stock=safety_stock,
                    )
                )

        return Product.objects.bulk_create(products)

    # ==================== WAREHOUSES (Bulgarian Cities) ====================

    def _seed_warehouses(self):
        """Like your seedWarehouses() method."""
        self.stdout.write("🏢 Seeding warehouses...")

        warehouse_data = [
            (
                "Главен склад София",
                "София, кв. Горубляне",
                WarehouseType.PHYSICAL,
                50000,
            ),
            (
                "Регионален склад Пловдив",
                "Пловдив, Индустриална зона",
                WarehouseType.PHYSICAL,
                30000,
            ),
            ("Склад Варна", "Варна, ПЗ Западна", WarehouseType.PHYSICAL, 25000),
            ("Склад Бургас", "Бургас, ПЗ Север", WarehouseType.PHYSICAL, 20000),
            (
                "Дистрибуционен център Русе",
                "Русе, Дунавска зона",
                WarehouseType.PHYSICAL,
                18000,
            ),
            (
                "Логистичен център Стара Загора",
                "Стара Загора, ПЗ",
                WarehouseType.PHYSICAL,
                15000,
            ),
            ("Виртуален склад", "Облак", WarehouseType.VIRTUAL, 100000),
            ("Консигнационен склад", "Различни локации", WarehouseType.VIRTUAL, 20000),
        ]

        warehouses = Warehouse.objects.bulk_create(
            [
                Warehouse(name=name, location=location, type=wtype, capacity=capacity)
                for name, location, wtype, capacity in warehouse_data
            ]
        )
        return warehouses

    # ==================== INVENTORY ITEMS ====================

    def _seed_inventory_items(self, products, warehouses):
        """
        Like your seedInventoryItems() method.

        Same logic: each product goes into 2-4 random physical warehouses
        with random quantities and a small reserved amount.

        In Java:
            Collections.shuffle(physicalWarehouses, random);
            for (int i = 0; i < numWarehouses; i++) { ... }

        In Python:
            self.rng.shuffle(physical)
            for wh in physical[:num_warehouses]: ...
        """
        self.stdout.write("📊 Seeding inventory items...")

        # Filter to physical warehouses only (same as Java)
        physical = [w for w in warehouses if w.type == WarehouseType.PHYSICAL]

        items = []
        for product in products:
            num_warehouses = self.rng.randint(2, 4)
            self.rng.shuffle(physical)

            for wh in physical[:num_warehouses]:
                quantity = self.rng.randint(10, 509)
                reserved = self.rng.randint(0, max(1, quantity // 5))

                items.append(
                    InventoryItem(
                        product=product,
                        warehouse=wh,
                        quantity=quantity,
                        reserved=reserved,
                    )
                )

        return InventoryItem.objects.bulk_create(items)

    # ==================== INVENTORY MOVEMENTS ====================

    def _seed_inventory_movements(self, inventory_items):
        """
        Like your seedInventoryMovements() method.

        Creates 3-8 movements per inventory item, simulating a realistic
        history of stock changes (receives, shipments, adjustments).

        Bulgarian reasons for realism:
            IN:  "Получена поръчка" (Order received)
            OUT: "Изпълнена поръчка" (Order fulfilled)
            ADJ: "Инвентаризация"    (Inventory count)
        """
        self.stdout.write("📈 Seeding inventory movements...")

        movement_types = [MovementType.IN, MovementType.OUT, MovementType.ADJUSTMENT]
        in_reasons = [
            "Получена поръчка",
            "Връщане от клиент",
            "Трансфер от склад",
            "Начален запас",
        ]
        out_reasons = [
            "Изпълнена поръчка",
            "Повредена стока",
            "Трансфер към склад",
            "Изпратен мостра",
        ]
        adj_reasons = [
            "Ревизия",
            "Инвентаризация",
            "Корекция на брак",
            "Системна корекция",
        ]

        movements = []
        for item in inventory_items:
            num_movements = self.rng.randint(3, 8)
            current_qty = 0

            for _ in range(num_movements):
                mtype = self.rng.choice(movement_types)

                if mtype == MovementType.IN:
                    quantity = self.rng.randint(20, 119)
                    reason = self.rng.choice(in_reasons)
                    ref_type = "PURCHASE_ORDER"
                elif mtype == MovementType.OUT:
                    quantity = min(self.rng.randint(5, 54), max(1, current_qty))
                    reason = self.rng.choice(out_reasons)
                    ref_type = "SYSTEM"
                else:
                    quantity = self.rng.randint(-10, 10)
                    reason = self.rng.choice(adj_reasons)
                    ref_type = "SYSTEM"

                qty_before = current_qty
                if mtype == MovementType.OUT:
                    qty_after = max(0, current_qty - quantity)
                else:
                    qty_after = max(0, current_qty + quantity)

                movements.append(
                    InventoryMovement(
                        inventory_item=item,
                        movement_type=mtype,
                        quantity=abs(quantity),
                        quantity_before=qty_before,
                        quantity_after=qty_after,
                        reason=reason,
                        reference_type=ref_type,
                    )
                )
                current_qty = qty_after

        InventoryMovement.objects.bulk_create(movements)
        self.stdout.write(f"   - {len(movements)} Inventory Movements")
