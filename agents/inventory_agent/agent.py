from sqlalchemy.orm import Session

from app.models import Inventory, Product
from app.services.agent_activity import log_agent_activity


def check_inventory(
    db: Session,
    product_id: int,
    requested_quantity: int,
):
    log_agent_activity(
        db=db,
        agent_name="Inventory Agent",
        action="inventory_check",
        status="started",
        details=f"Checking product {product_id} for {requested_quantity} units",
    )

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        log_agent_activity(
            db=db,
            agent_name="Inventory Agent",
            action="inventory_check",
            status="failed",
            details="Product not found",
        )

        return {
            "success": False,
            "message": "Product not found",
        }

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if not inventory:
        log_agent_activity(
            db=db,
            agent_name="Inventory Agent",
            action="inventory_check",
            status="failed",
            details=f"Inventory record not found for product {product_id}",
        )

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

        log_agent_activity(
            db=db,
            agent_name="Inventory Agent",
            action="inventory_check",
            status="completed",
            details=f"{product.sku}: {available} available, {requested_quantity} requested",
        )
    else:
        result["message"] = "Insufficient stock"
        result["restock_recommendation"] = {
            "recommended_quantity": shortage,
            "reason": f"Short by {shortage} units",
        }

        log_agent_activity(
            db=db,
            agent_name="Inventory Agent",
            action="restock_recommendation",
            status="completed",
            details=f"{product.sku}: short by {shortage} units; recommend restocking {shortage}",
        )

    return result
