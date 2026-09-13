from fastapi import APIRouter, Depends, HTTPException
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


@router.get("/{product_id}/restock-recommendation")
def get_restock_recommendation(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    inventory = (
        db.query(Inventory)
        .filter(Inventory.product_id == product_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found",
        )

    target_stock = inventory.low_stock_threshold * 2

    recommended_quantity = max(
        target_stock - inventory.quantity,
        0,
    )

    return {
        "success": True,
        "recommendation": {
            "product_id": product.id,
            "product": product.name,
            "sku": product.sku,
            "current_quantity": inventory.quantity,
            "low_stock_threshold": inventory.low_stock_threshold,
            "target_stock": target_stock,
            "recommended_quantity": recommended_quantity,
            "reason": (
                f"AI recommends restocking {recommended_quantity} units "
                f"to reach the target stock level of {target_stock}."
                if recommended_quantity > 0
                else "Stock is already at or above the target level."
            ),
        },
    }
@router.post("/{product_id}/restock")
def restock_inventory(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db),
):
    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Restock quantity must be greater than 0",
        )

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    inventory = (
        db.query(Inventory)
        .filter(Inventory.product_id == product_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found",
        )

    inventory.quantity += quantity

    db.commit()
    db.refresh(inventory)

    return {
        "success": True,
        "message": "Inventory restocked successfully",
        "product_id": product.id,
        "product": product.name,
        "sku": product.sku,
        "restocked_quantity": quantity,
        "new_quantity": inventory.quantity,
    }
