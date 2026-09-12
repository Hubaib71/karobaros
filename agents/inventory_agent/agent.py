from sqlalchemy.orm import Session

from app.models import Inventory, Product


def check_inventory(
    db: Session,
    product_id: int,
    requested_quantity: int,
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        return {
            "success": False,
            "message": "Product not found",
        }

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if not inventory:
        return {
            "success": False,
            "message": "Inventory record not found",
            "product_id": product_id,
        }

    available = inventory.quantity
    shortage = max(requested_quantity - available, 0)
    sufficient = available >= requested_quantity

    result = {
        "success": True,
        "product_id": product.id,
        "product": product.name,
        "sku": product.sku,
        "requested": requested_quantity,
        "available": available,
        "sufficient": sufficient,
        "shortage": shortage,
    }

    if sufficient:
        result["message"] = "Stock is sufficient"
        result["remaining_after_order"] = available - requested_quantity
    else:
        result["message"] = "Insufficient stock"
        result["restock_recommendation"] = {
            "recommended_quantity": shortage,
            "reason": f"Short by {shortage} units",
        }

    return result