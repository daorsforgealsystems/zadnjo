from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Inventory Service")

class ScanRequest(BaseModel):
    barcode: str
    warehouse_id: Optional[str] = None

@app.get("/inventory/items")
async def list_items(warehouseId: Optional[str] = None, lowStock: Optional[bool] = False):
    # Placeholder response
    return {"items": [], "warehouseId": warehouseId, "lowStock": lowStock}

@app.post("/inventory/scan")
async def process_scan(req: ScanRequest):
    return {"ok": True, "barcode": req.barcode, "warehouse": req.warehouse_id}

@app.get("/health")
async def health():
    return {"status": "ok"}