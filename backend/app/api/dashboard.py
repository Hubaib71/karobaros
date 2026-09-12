from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer, Inventory, Order, Product

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()

    total_orders = db.query(Order).count()

    approved_orders = db.query(Order).filter(
        Order.status == "approved"
    ).count()

    pending_orders = db.query(Order).filter(
        Order.status == "pending_approval"
    ).count()

    total_sales = db.query(
        func.coalesce(func.sum(Order.total_amount), 0)
    ).filter(
        Order.status == "approved"
    ).scalar()

    low_stock_items = db.query(Inventory).filter(
        Inventory.quantity <= Inventory.low_stock_threshold
    ).count()

    return {
        "success": True,
        "summary": {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "approved_orders": approved_orders,
            "pending_orders": pending_orders,
            "total_sales": float(total_sales),
            "low_stock_items": low_stock_items,
        },
    }
@router.get("/recent-orders")
def get_recent_orders(
    limit: int = 5,
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "success": True,
        "orders": [
            {
                "id": order.id,
                "order_number": order.order_number,
                "customer_id": order.customer_id,
                "status": order.status,
                "total_amount": float(order.total_amount),
                "delivery_city": order.delivery_city,
                "created_at": order.created_at,
            }
            for order in orders
        ],
    }
@router.get("/low-stock")
def get_low_stock_products(db: Session = Depends(get_db)):
    items = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .order_by(Inventory.quantity.asc())
        .all()
    )

    return {
        "success": True,
        "count": len(items),
        "items": [
            {
                "product_id": product.id,
                "product": product.name,
                "sku": product.sku,
                "quantity": inventory.quantity,
                "low_stock_threshold": inventory.low_stock_threshold,
                "shortage": max(
                    inventory.low_stock_threshold - inventory.quantity,
                    0,
                ),
            }
            for inventory, product in items
        ],
    }