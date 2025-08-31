# Documentation Standards

## 1. Code Comments
### TypeScript/JavaScript
```typescript
/**
 * Calculate total price with tax
 * @param items - Array of items with price and quantity
 * @param taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns Total price with tax applied
 */
function calculateTotal(items: Item[], taxRate: number): number {
  // ... implementation
}
```

### Python
```python
def calculate_total(items: list[Item], tax_rate: float) -> float:
    """
    Calculate total price with tax
    
    Args:
        items: List of items with price and quantity
        tax_rate: Tax rate as decimal (e.g., 0.1 for 10%)
    
    Returns:
        Total price with tax applied
    """
    # ... implementation
```

## 2. API Endpoints
Use OpenAPI specifications in JSDoc comments:
```typescript
/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
app.post('/api/orders', createOrder);
```

## 3. Database Changes
For all schema modifications:
1. Create a migration file in `database/migrations/`
2. Update `database/schema.sql`
3. Document changes in the migration file header:
```sql
-- Migration: Add inventory tracking
-- Created at: 2023-11-15
-- Description: Adds warehouse_id to items table for inventory tracking
```

## 4. Component Documentation (React)
```jsx
/**
 * DashboardWidget Component
 * 
 * Props:
 *   - title: Widget title (string)
 *   - data: Data to display (array)
 *   - loading: Loading state (boolean)
 *   - onRefresh: Refresh callback (function)
 * 
 * Example:
 *   <DashboardWidget 
 *     title="Recent Orders" 
 *     data={orders} 
 *     loading={isLoading}
 *     onRefresh={fetchOrders}
 *   />
 */
export default function DashboardWidget({ title, data, loading, onRefresh }) {
  // ... component implementation
}
```

## 5. Change Workflow
1. When adding new features:
   - Update relevant README.md files
   - Add/update OpenAPI specifications
   - Create migration files for database changes
2. When modifying existing functionality:
   - Update code comments
   - Update API documentation if interfaces change
   - Add database migration if schema changes

## 6. Documentation Review
All documentation updates must be reviewed in PRs alongside code changes.