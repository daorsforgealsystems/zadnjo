from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any
from uuid import uuid4

app = FastAPI(title="Inventory Service")

# CORS (allow local dev by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Models (minimal, BE placeholder)
# -----------------------------

class Capacity(BaseModel):
    total_sqft: int
    used_sqft: int = 0
    zones: List[Dict[str, Any]] = []

class ContactInfo(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    manager: Optional[str] = None

class Location(BaseModel):
    lat: float
    lng: float

class Warehouse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    capacity: Capacity
    contactInfo: Optional[ContactInfo] = None
    location: Optional[Location] = None
    isActive: bool = True

class InventoryItem(BaseModel):
    id: str
    sku: str
    name: str
    barcode: Optional[str] = None

class InventoryLevel(BaseModel):
    id: str
    itemId: str
    warehouseId: str
    quantity: int
    reservedQuantity: int = 0
    reorderPoint: Optional[int] = None
    reorderQuantity: Optional[int] = None
    locationCode: Optional[str] = None

class ScanRequest(BaseModel):
    barcode: str
    warehouse_id: Optional[str] = None

class StockMovement(BaseModel):
    id: Optional[str] = None
    itemId: str
    warehouseId: str
    movementType: Literal['inbound','outbound','transfer','adjustment','return']
    quantity: int
    referenceType: Optional[Literal['order','transfer','adjustment','return']] = None
    referenceId: Optional[str] = None
    fromLocation: Optional[str] = None
    toLocation: Optional[str] = None
    notes: Optional[str] = None

# -----------------------------
# In-memory data (temporary stubs)
# -----------------------------
WAREHOUSES: Dict[str, Warehouse] = {}
INVENTORY_LEVELS: List[InventoryLevel] = []
STOCK_MOVEMENTS: List[StockMovement] = []

# Seed one demo warehouse
_demo_wh_id = str(uuid4())
WAREHOUSES[_demo_wh_id] = Warehouse(
    id=_demo_wh_id,
    name="Main Distribution Center",
    code="WH-001",
    address="123 Logistics Way, City, State 12345",
    capacity=Capacity(total_sqft=50000, used_sqft=10000, zones=[]),
    contactInfo=ContactInfo(phone="+1 555-123-4567", email="warehouse@company.com", manager="John Smith"),
    location=Location(lat=0.0, lng=0.0),
    isActive=True,
)

# ---------------------------------
# Existing endpoints (kept as-is)
# ---------------------------------
@app.get("/inventory/items")
async def list_items(warehouseId: Optional[str] = None, lowStock: Optional[bool] = False):
    # Placeholder response
    return {"items": [], "warehouseId": warehouseId, "lowStock": lowStock}

@app.post("/inventory/scan")
async def process_scan(req: ScanRequest):
    # Placeholder barcode scan
    return {"ok": True, "barcode": req.barcode, "warehouse": req.warehouse_id}

@app.get("/health")
async def health():
    return {"status": "ok"}

# ---------------------------------
# New minimal endpoints for WH & INV
# ---------------------------------

# Warehouses
@app.get("/warehouses", response_model=List[Warehouse])
async def get_warehouses():
    return [w for w in WAREHOUSES.values() if w.isActive]

class CreateWarehouseRequest(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    capacity: Capacity
    contactInfo: Optional[ContactInfo] = None
    location: Optional[Location] = None
    isActive: Optional[bool] = True

@app.post("/warehouses", response_model=Warehouse)
async def create_warehouse(req: CreateWarehouseRequest):
    wid = str(uuid4())
    wh = Warehouse(
        id=wid,
        name=req.name,
        code=req.code,
        address=req.address,
        capacity=req.capacity,
        contactInfo=req.contactInfo,
        location=req.location,
        isActive=req.isActive if req.isActive is not None else True,
    )
    WAREHOUSES[wid] = wh
    return wh

# Inventory levels
@app.get("/inventory/levels", response_model=List[InventoryLevel])
async def get_inventory_levels(warehouseId: Optional[str] = None):
    levels = INVENTORY_LEVELS
    if warehouseId:
        levels = [l for l in levels if l.warehouseId == warehouseId]
    return levels

@app.get("/inventory/low-stock", response_model=List[InventoryLevel])
async def get_low_stock(warehouseId: Optional[str] = None):
    levels = INVENTORY_LEVELS
    if warehouseId:
        levels = [l for l in levels if l.warehouseId == warehouseId]
    # Low stock: quantity <= reorderPoint if set
    return [l for l in levels if l.reorderPoint is not None and l.quantity <= (l.reorderPoint or 0)]

# Stock movement recording
@app.post("/inventory/movements", response_model=StockMovement)
async def record_stock_movement(m: StockMovement):
    # Assign id if not provided
    if not m.id:
        m.id = str(uuid4())

    # Apply simple in-memory adjustment to matching inventory level
    level = next((l for l in INVENTORY_LEVELS if l.itemId == m.itemId and l.warehouseId == m.warehouseId), None)
    if level is None:
        level = InventoryLevel(
            id=str(uuid4()),
            itemId=m.itemId,
            warehouseId=m.warehouseId,
            quantity=0,
            reservedQuantity=0,
        )
        INVENTORY_LEVELS.append(level)

    adj = m.quantity if m.movementType in ("inbound", "return") else -m.quantity
    level.quantity = max(0, level.quantity + adj)

    STOCK_MOVEMENTS.append(m)
    return m