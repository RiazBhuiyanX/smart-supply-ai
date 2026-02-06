package com.smartsupply.config;

import com.smartsupply.entity.*;
import com.smartsupply.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Data Seeder - Generates comprehensive mock data for testing.
 * Data is localized for Bulgaria with Bulgarian companies, cities, and products.
 * 
 * Activated by the 'seed' profile:
 * Run with: mvn spring-boot:run -Dspring-boot.run.profiles=seed
 * Or set in application.yml: spring.profiles.active=seed
 */
@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private final Random random = new Random(42);

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🌱 Starting data seeding (Bulgaria localized)...");
        
        clearAllData();
        
        List<Supplier> suppliers = seedSuppliers();
        List<Product> products = seedProducts();
        List<Warehouse> warehouses = seedWarehouses();
        List<InventoryItem> inventoryItems = seedInventoryItems(products, warehouses);
        seedPurchaseOrders(suppliers, products);
        seedInventoryMovements(inventoryItems);
        
        log.info("✅ Data seeding complete!");
        log.info("📊 Summary:");
        log.info("   - {} Suppliers", suppliers.size());
        log.info("   - {} Products", products.size());
        log.info("   - {} Warehouses", warehouses.size());
        log.info("   - {} Inventory Items", inventoryItems.size());
    }

    private void clearAllData() {
        log.info("🗑️ Clearing existing data with TRUNCATE CASCADE...");
        entityManager.createNativeQuery("TRUNCATE TABLE inventory_movements CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE inventory_items CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE purchase_order_items CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE purchase_orders CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE products CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE suppliers CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE warehouses CASCADE").executeUpdate();
        entityManager.flush();
        log.info("✅ All tables cleared!");
    }

    // ==================== SUPPLIERS (Bulgarian Companies) ====================
    private List<Supplier> seedSuppliers() {
        log.info("🏭 Seeding suppliers (Bulgarian companies)...");
        List<Supplier> suppliers = Arrays.asList(
            createSupplier("Техномаркет България", "orders@technomarket.bg", "+359 2 962 1234", "бул. Цариградско шосе 115, София 1784", "Георги Иванов"),
            createSupplier("Емаг България", "suppliers@emag.bg", "+359 2 489 5000", "бул. Ботевградско шосе 247, София 1517", "Мария Петрова"),
            createSupplier("Офис 1 Суперстор", "info@office1.bg", "+359 2 981 8100", "ул. Околовръстен път 260, София 1766", "Александър Димитров"),
            createSupplier("БГ Електроникс", "sales@bgelectronics.bg", "+359 32 625 123", "ул. Брезовско шосе 176, Пловдив 4000", "Николай Стоянов"),
            createSupplier("Софтуни Хардуер", "hardware@softuni.bg", "+359 2 421 3030", "бул. България 102, София 1680", "Стефан Колев"),
            createSupplier("Варна Компютри", "office@varnapc.bg", "+359 52 612 345", "бул. Владислав Варненчик 186, Варна 9000", "Елена Георгиева"),
            createSupplier("Бургас Техника", "sales@burgastechnika.bg", "+359 56 842 678", "ул. Александровска 21, Бургас 8000", "Димитър Тодоров"),
            createSupplier("Русе Компоненти", "info@rusecomponents.bg", "+359 82 831 456", "бул. Липник 117, Русе 7000", "Ивайло Николов"),
            createSupplier("Пловдив Офис", "contact@plovdivoffice.bg", "+359 32 943 789", "ул. Капитан Райчо 56, Пловдив 4000", "Калина Атанасова"),
            createSupplier("Стара Загора Дистрибуция", "orders@szd.bg", "+359 42 620 111", "ул. Индустриална 23, Стара Загора 6000", "Петър Василев"),
            createSupplier("Балкан Електроникс", "sales@balkanelectronics.bg", "+359 2 818 2020", "бул. Симеоновско шосе 110, София 1700", "Веселин Христов"),
            createSupplier("Черноморски Доставки", "logistics@blacksea-supply.bg", "+359 52 300 400", "Промишлена зона Запад, Варна 9000", "Росица Маринова")
        );
        return supplierRepository.saveAll(suppliers);
    }

    private Supplier createSupplier(String name, String email, String phone, String address, String contactPerson) {
        return Supplier.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .address(address)
                .contactPerson(contactPerson)
                .build();
    }

    // ==================== PRODUCTS ====================
    private List<Product> seedProducts() {
        log.info("📦 Seeding products...");
        List<Product> products = new ArrayList<>();
        
        // Електроника (Electronics)
        products.addAll(createProductCategory("Електроника", Arrays.asList(
            new String[]{"ELEC-001", "Лаптоп Lenovo ThinkPad", "1280.00", "30"},
            new String[]{"ELEC-002", "Безжична мишка Logitech", "30.00", "200"},
            new String[]{"ELEC-003", "Механична клавиатура", "140.00", "80"},
            new String[]{"ELEC-004", "Монитор 27\" 4K Samsung", "460.00", "50"},
            new String[]{"ELEC-005", "USB-C Hub 7-Port", "45.00", "150"},
            new String[]{"ELEC-006", "Уеб камера HD 1080p", "75.00", "100"},
            new String[]{"ELEC-007", "Bluetooth слушалки Sony", "180.00", "60"},
            new String[]{"ELEC-008", "Външен SSD 1TB Samsung", "100.00", "90"},
            new String[]{"ELEC-009", "Смарт колонка Google", "90.00", "70"},
            new String[]{"ELEC-010", "Безжично зарядно", "35.00", "180"}
        )));

        // Компоненти (Components)
        products.addAll(createProductCategory("Компоненти", Arrays.asList(
            new String[]{"COMP-001", "Процесор Intel Core i7-14700K", "410.00", "25"},
            new String[]{"COMP-002", "Видеокарта RTX 4070 Super", "615.00", "20"},
            new String[]{"COMP-003", "RAM памет DDR5 32GB", "125.00", "50"},
            new String[]{"COMP-004", "Дънна платка Z790", "245.00", "35"},
            new String[]{"COMP-005", "Захранване 850W Gold", "110.00", "45"},
            new String[]{"COMP-006", "Водно охлаждане 360mm", "150.00", "30"},
            new String[]{"COMP-007", "NVMe SSD 2TB", "150.00", "60"},
            new String[]{"COMP-008", "Кутия за PC Full Tower", "125.00", "25"},
            new String[]{"COMP-009", "RGB вентилатори 3 бр.", "45.00", "100"},
            new String[]{"COMP-010", "Термо паста", "8.00", "300"}
        )));

        // Офис консумативи (Office Supplies)
        products.addAll(createProductCategory("Офис консумативи", Arrays.asList(
            new String[]{"OFFC-001", "Хартия А4 500 листа", "6.50", "500"},
            new String[]{"OFFC-002", "Тонер касета черна HP", "45.00", "100"},
            new String[]{"OFFC-003", "Тонер касета цветна HP", "65.00", "80"},
            new String[]{"OFFC-004", "Телбод тежък", "20.00", "60"},
            new String[]{"OFFC-005", "Органайзер за бюро", "25.00", "80"},
            new String[]{"OFFC-006", "Бяла дъска 120x90", "75.00", "30"},
            new String[]{"OFFC-007", "Маркери комплект 12 бр.", "12.00", "200"},
            new String[]{"OFFC-008", "Тетрадки А5 5 бр.", "7.50", "300"},
            new String[]{"OFFC-009", "Кламери 100 бр.", "2.50", "500"},
            new String[]{"OFFC-010", "Самозалепващи листчета", "5.00", "400"}
        )));

        // Мрежово оборудване (Networking)
        products.addAll(createProductCategory("Мрежово оборудване", Arrays.asList(
            new String[]{"NETW-001", "Рутер WiFi 6E TP-Link", "200.00", "40"},
            new String[]{"NETW-002", "Мрежов суич 24-порта", "180.00", "25"},
            new String[]{"NETW-003", "Ethernet кабел Cat6 15м", "15.00", "200"},
            new String[]{"NETW-004", "Access Point Ubiquiti", "150.00", "35"},
            new String[]{"NETW-005", "Пач панел 48-порта", "75.00", "20"},
            new String[]{"NETW-006", "Мрежов шкаф 42U", "410.00", "10"},
            new String[]{"NETW-007", "PoE инжектор 8-порта", "100.00", "30"},
            new String[]{"NETW-008", "Оптичен кабел 100м", "125.00", "15"},
            new String[]{"NETW-009", "Мрежов тестер", "60.00", "40"},
            new String[]{"NETW-010", "Кабелен органайзер", "25.00", "100"}
        )));

        // Офис мебели (Office Furniture)
        products.addAll(createProductCategory("Офис мебели", Arrays.asList(
            new String[]{"FURN-001", "Ергономичен офис стол", "300.00", "20"},
            new String[]{"FURN-002", "Електрическо бюро 160см", "460.00", "15"},
            new String[]{"FURN-003", "Стойка за монитор двойна", "75.00", "40"},
            new String[]{"FURN-004", "LED настолна лампа", "40.00", "80"},
            new String[]{"FURN-005", "Шкаф с 3 чекмеджета", "150.00", "25"},
            new String[]{"FURN-006", "Етажерка за книги 5 рафта", "110.00", "30"},
            new String[]{"FURN-007", "Заседателна маса 240см", "560.00", "8"},
            new String[]{"FURN-008", "Посетителски стол", "110.00", "35"},
            new String[]{"FURN-009", "Преграден параван", "180.00", "12"},
            new String[]{"FURN-010", "Поставка за клавиатура", "45.00", "50"}
        )));

        return productRepository.saveAll(products);
    }

    private List<Product> createProductCategory(String category, List<String[]> items) {
        List<Product> products = new ArrayList<>();
        for (String[] item : items) {
            products.add(Product.builder()
                    .sku(item[0])
                    .name(item[1])
                    .category(category)
                    .price(new BigDecimal(item[2]))
                    .safetyStock(Integer.parseInt(item[3]))
                    .build());
        }
        return products;
    }

    // ==================== WAREHOUSES (Bulgarian Cities) ====================
    private List<Warehouse> seedWarehouses() {
        log.info("🏢 Seeding warehouses (Bulgarian locations)...");
        List<Warehouse> warehouses = Arrays.asList(
            createWarehouse("Главен склад София", "София, кв. Горубляне", WarehouseType.PHYSICAL, 50000),
            createWarehouse("Регионален склад Пловдив", "Пловдив, Индустриална зона", WarehouseType.PHYSICAL, 30000),
            createWarehouse("Склад Варна", "Варна, ПЗ Западна", WarehouseType.PHYSICAL, 25000),
            createWarehouse("Склад Бургас", "Бургас, ПЗ Север", WarehouseType.PHYSICAL, 20000),
            createWarehouse("Дистрибуционен център Русе", "Русе, Дунавска зона", WarehouseType.PHYSICAL, 18000),
            createWarehouse("Логистичен център Стара Загора", "Стара Загора, ПЗ", WarehouseType.PHYSICAL, 15000),
            createWarehouse("Виртуален склад", "Облак", WarehouseType.VIRTUAL, 100000),
            createWarehouse("Консигнационен склад", "Различни локации", WarehouseType.VIRTUAL, 20000)
        );
        return warehouseRepository.saveAll(warehouses);
    }

    private Warehouse createWarehouse(String name, String location, WarehouseType type, int capacity) {
        return Warehouse.builder()
                .name(name)
                .location(location)
                .type(type)
                .capacity(capacity)
                .build();
    }

    // ==================== INVENTORY ITEMS ====================
    private List<InventoryItem> seedInventoryItems(List<Product> products, List<Warehouse> warehouses) {
        log.info("📊 Seeding inventory items...");
        List<InventoryItem> items = new ArrayList<>();
        
        List<Warehouse> physicalWarehouses = new ArrayList<>(warehouses.stream()
                .filter(w -> w.getType() == WarehouseType.PHYSICAL)
                .toList());

        for (Product product : products) {
            int numWarehouses = random.nextInt(3) + 2;
            Collections.shuffle(physicalWarehouses, random);
            
            for (int i = 0; i < Math.min(numWarehouses, physicalWarehouses.size()); i++) {
                Warehouse warehouse = physicalWarehouses.get(i);
                int quantity = random.nextInt(500) + 10;
                int reserved = random.nextInt(Math.max(1, quantity / 5));
                
                items.add(InventoryItem.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .quantity(quantity)
                        .reserved(reserved)
                        .build());
            }
        }
        
        return inventoryItemRepository.saveAll(items);
    }

    // ==================== PURCHASE ORDERS ====================
    private void seedPurchaseOrders(List<Supplier> suppliers, List<Product> products) {
        log.info("📋 Seeding purchase orders...");
        
        int orderNum = 1;
        LocalDate today = LocalDate.now();
        
        OrderStatus[] statuses = {OrderStatus.DRAFT, OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.SENT, 
                                   OrderStatus.SENT, OrderStatus.RECEIVED, OrderStatus.RECEIVED, 
                                   OrderStatus.RECEIVED, OrderStatus.CANCELLED};
        
        for (int i = 0; i < 30; i++) {
            Supplier supplier = suppliers.get(random.nextInt(suppliers.size()));
            OrderStatus status = statuses[random.nextInt(statuses.length)];
            
            PurchaseOrder order = PurchaseOrder.builder()
                    .orderNumber(String.format("ПО-%d-%03d", today.getYear(), orderNum++))
                    .supplier(supplier)
                    .status(status)
                    .expectedDate(today.plusDays(random.nextInt(30) + 5))
                    .items(new ArrayList<>())
                    .build();
            
            int numItems = random.nextInt(5) + 2;
            List<Product> shuffledProducts = new ArrayList<>(products);
            Collections.shuffle(shuffledProducts, random);
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            for (int j = 0; j < numItems; j++) {
                Product product = shuffledProducts.get(j);
                int quantity = (random.nextInt(10) + 1) * 10;
                BigDecimal unitPrice = product.getPrice();
                int quantityReceived = 0;
                
                if (status == OrderStatus.RECEIVED) {
                    quantityReceived = quantity;
                }
                
                PurchaseOrderItem item = PurchaseOrderItem.builder()
                        .purchaseOrder(order)
                        .product(product)
                        .quantityOrdered(quantity)
                        .quantityReceived(quantityReceived)
                        .unitPrice(unitPrice)
                        .build();
                
                order.getItems().add(item);
                totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            }
            
            order.setTotalAmount(totalAmount);
            purchaseOrderRepository.save(order);
        }
    }

    // ==================== INVENTORY MOVEMENTS ====================
    private void seedInventoryMovements(List<InventoryItem> inventoryItems) {
        log.info("📈 Seeding inventory movements...");
        
        MovementType[] types = {MovementType.IN, MovementType.OUT, MovementType.ADJUSTMENT};
        String[] inReasons = {"Получена поръчка", "Връщане от клиент", "Трансфер от склад", "Начален запас"};
        String[] outReasons = {"Изпълнена поръчка", "Повредена стока", "Трансфер към склад", "Изпратен мостра"};
        String[] adjustReasons = {"Ревизия", "Инвентаризация", "Корекция на брак", "Системна корекция"};
        
        for (InventoryItem item : inventoryItems) {
            int numMovements = random.nextInt(6) + 3;
            int currentQty = 0;
            
            for (int i = 0; i < numMovements; i++) {
                MovementType type = types[random.nextInt(types.length)];
                int quantity;
                String reason;
                
                switch (type) {
                    case IN:
                        quantity = random.nextInt(100) + 20;
                        reason = inReasons[random.nextInt(inReasons.length)];
                        break;
                    case OUT:
                        quantity = Math.min(random.nextInt(50) + 5, Math.max(1, currentQty));
                        reason = outReasons[random.nextInt(outReasons.length)];
                        break;
                    default:
                        quantity = random.nextInt(21) - 10;
                        reason = adjustReasons[random.nextInt(adjustReasons.length)];
                }
                
                int qtyBefore = currentQty;
                int qtyAfter = type == MovementType.OUT ? currentQty - quantity : currentQty + quantity;
                qtyAfter = Math.max(0, qtyAfter);
                
                InventoryMovement movement = InventoryMovement.builder()
                        .inventoryItem(item)
                        .movementType(type)
                        .quantity(Math.abs(quantity))
                        .quantityBefore(qtyBefore)
                        .quantityAfter(qtyAfter)
                        .reason(reason)
                        .referenceType(type == MovementType.IN ? "PURCHASE_ORDER" : "SYSTEM")
                        .build();
                
                inventoryMovementRepository.save(movement);
                currentQty = qtyAfter;
            }
        }
    }
}
