package com.smartsupply.service;

import com.smartsupply.entity.*;
import com.smartsupply.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Value("${gemini.api-key}") // Fix: Ensure this matches application.yml key, often camelCase or kebab-case
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=";

    @Transactional(readOnly = true)
    public String generateResponse(String userMessage) {
        try {
            // 1. Aggregate Context (Wrap in try-catch to handle DB errors)
            String context = buildContext();

            // 2. Build Prompt
            String systemPrompt = "You are SmartSupply Assistant, an AI expert in supply chain management. " +
                    "Use the provided database context to answer the user's question. " +
                    "You SHOULD aggregate, summarize, and count data when asked (e.g., 'total inventory', 'how many products'). " +
                    "If the answer is not in the data, say you don't know. " +
                    "Be concise but informative. Format money as EUR (€). " +
                    "\n\nDATA CONTEXT:\n" + context;

            // 3. Call Gemini
            return callGeminiApi(systemPrompt, userMessage);
            
        } catch (Exception e) {
            log.error("Critical Error in AiService", e);
            // Return error as a chat message so frontend doesn't break
            return "I am experiencing technical difficulties. Detailed error: " + e.getMessage();
        }
    }

    private String buildContext() {
        StringBuilder sb = new StringBuilder();

        // Products
        List<Product> products = productRepository.findAll();
        sb.append("PRODUCTS (Total: ").append(products.size()).append("):\n");
        for (Product p : products) {
            sb.append(String.format("- %s (SKU: %s, Price: %.2f, Category: %s, Safety Stock: %d)\n",
                    p.getName(), p.getSku(), p.getPrice(), p.getCategory(), (p.getSafetyStock() != null ? p.getSafetyStock() : 0)));
        }
        sb.append("\n");

        // Warehouses
        List<Warehouse> warehouseList = warehouseRepository.findAll();
        sb.append("WAREHOUSES:\n");
        for (Warehouse w : warehouseList) {
            sb.append(String.format("- %s (%s)\n", w.getName(), w.getLocation()));
        }
        sb.append("\n");

        // Inventory
        List<InventoryItem> inventory = inventoryRepository.findAll();
        int totalQuantity = inventory.stream().mapToInt(InventoryItem::getQuantity).sum();
        double totalValue = inventory.stream()
            .mapToDouble(i -> i.getQuantity() * i.getProduct().getPrice().doubleValue())
            .sum();
            
        sb.append(String.format("INVENTORY SUMMARY: Total Items: %d, Total Value: %.2f EUR\n", totalQuantity, totalValue));
        sb.append("INVENTORY DETAILS:\n");
        for (InventoryItem i : inventory) {
             int safetyStock = i.getProduct().getSafetyStock() != null ? i.getProduct().getSafetyStock() : 0;
             boolean isLowStock = i.getQuantity() <= safetyStock;
             
             sb.append(String.format("- Product: %s, Warehouse: %s, Quantity: %d%s\n",
                     i.getProduct().getName(), 
                     i.getWarehouse().getName(), 
                     i.getQuantity(),
                     (isLowStock ? " [LOW STOCK WARNING]" : "")));
        }
        sb.append("\n");

        // Suppliers
        List<Supplier> suppliers = supplierRepository.findAll();
        sb.append("SUPPLIERS:\n");
        for (Supplier s : suppliers) {
            sb.append(String.format("- %s (Contact: %s, Email: %s)\n",
                    s.getName(), s.getContactPerson(), s.getEmail()));
        }
        sb.append("\n");

        // Recent POs (Limit to last 10 for context size)
        List<PurchaseOrder> orders = purchaseOrderRepository.findAll(); // In real app, use Pageable
        sb.append("RECENT PURCHASE ORDERS:\n");
        for (PurchaseOrder po : orders) {
             String itemsSummary = po.getItems().stream()
                 .map(item -> String.format("%dx %s", item.getQuantityOrdered(), item.getProduct().getName()))
                 .collect(Collectors.joining(", "));
             
             sb.append(String.format("- Order #%s: Supplier: %s, Status: %s, Total: %.2f, Items: [%s]\n",
                     po.getId(), po.getSupplier().getName(), po.getStatus(), po.getTotalAmount(), itemsSummary));
        }
        sb.append("\n");

        // Recent Inventory Movements (History)
        List<InventoryMovement> movements = inventoryMovementRepository.findAll(); // Limit in real app
        sb.append("RECENT INVENTORY MOVEMENTS (History):\n");
        for (InventoryMovement m : movements) {
            sb.append(String.format("- %s: %s %d units of %s at %s (Reason: %s, User: %s)\n",
                    m.getCreatedAt(), m.getMovementType(), m.getQuantity(), 
                    m.getInventoryItem().getProduct().getName(),
                    m.getInventoryItem().getWarehouse().getName(),
                    m.getReason(),
                    (m.getPerformedBy() != null ? m.getPerformedBy().getEmail() : "System")));
        }

        return sb.toString();
    }

    private String callGeminiApi(String systemPrompt, String userMessage) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Gemini Request Body Structure
            Map<String, Object> requestBody = new HashMap<>();
            
            // Gemini 1.5 format: contents: [{ role: "user", parts: [{ text: "..." }] }]
            // We prepend system prompt to the user message
            
            String combinedPrompt = systemPrompt + "\n\nUSER QUESTION: " + userMessage;
            
            Map<String, Object> part = new HashMap<>();
            part.put("text", combinedPrompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            requestBody.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Use exchange with ParameterizedTypeReference to avoid raw type warnings
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    GEMINI_API_URL + geminiApiKey,
                    org.springframework.http.HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            // Parse Response
            // Response structure: candidates[0].content.parts[0].text
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }

            return "I'm sorry, I couldn't understand that.";

        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            throw new RuntimeException("Gemini API Error: " + e.getMessage());
        }
    }
}
