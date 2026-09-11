from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Inventory, Product

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"],
)


@router.get("/")
def get_inventory(db: Session = Depends(get_db)):
    rows = (
        db.query(Product, Inventory)
        .join(Inventory, Product.id == Inventory.product_id)
        .all()
    )

    return {
        "success": True,
        "count": len(rows),
        "inventory": [
            {
                "product_id": product.id,
                "name": product.name,
                "sku": product.sku,
                "price": float(product.price),
                "quantity": inventory.quantity,
                "low_stock_threshold": inventory.low_stock_threshold,
                "low_stock": (
                    inventory.quantity <= inventory.low_stock_threshold
                ),
            }
            for product, inventory in rows
        ],
    }
@router.get("/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    rows = (
        db.query(Product, Inventory)
        .join(Inventory, Product.id == Inventory.product_id)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .all()
    )

    return {
        "success": True,
        "count": len(rows),
        "low_stock": [
            {
                "product_id": product.id,
                "name": product.name,
                "sku": product.sku,
                "quantity": inventory.quantity,
                "low_stock_threshold": inventory.low_stock_threshold,
                "shortage": max(
                    inventory.low_stock_threshold - inventory.quantity,
                    0,
                ),
            }
            for product, inventory in rows
        ],
    }
