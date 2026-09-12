from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer, Inventory, Invoice, Order

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(Inventory).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    approved_orders = (
        db.query(Order)
        .filter(Order.status == "approved")
        .count()
    )

    pending_orders = (
        db.query(Order)
        .filter(Order.status == "pending_approval")
        .count()
    )

    approved_order_records = (
        db.query(Order)
        .filter(Order.status == "approved")
        .all()
    )

    total_sales = sum(
        float(order.total_amount)
        for order in approved_order_records
    )

    average_order_value = (
        total_sales / approved_orders
        if approved_orders
        else 0
    )

    approval_rate = (
        (approved_orders / total_orders) * 100
        if total_orders
        else 0
    )

    low_stock_items = (
        db.query(Inventory)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .count()
    )

    return {
        "success": True,
        "summary": {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "approved_orders": approved_orders,
            "pending_orders": pending_orders,
            "total_sales": total_sales,
            "low_stock_items": low_stock_items,
            "average_order_value": average_order_value,
            "approval_rate": approval_rate,
        },
    }


@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )

    result = []

    for order in orders:
        customer = (
            db.query(Customer)
            .filter(Customer.id == order.customer_id)
            .first()
        )

        invoice = (
            db.query(Invoice)
            .filter(Invoice.order_id == order.id)
            .first()
        )

        result.append(
            {
                "id": order.id,
                "order_number": order.order_number,
                "customer_id": order.customer_id,
                "customer_name": (
                    customer.name
                    if customer
                    else f"Customer #{order.customer_id}"
                ),
                "status": order.status,
                "total_amount": float(order.total_amount),
                "delivery_city": order.delivery_city,
                "invoice_number": (
                    invoice.invoice_number
                    if invoice
                    else None
                ),
                "created_at": order.created_at,
            }
        )

    return {
        "success": True,
        "count": len(result),
        "orders": result,
    }


@router.get("/low-stock")
def get_dashboard_low_stock(db: Session = Depends(get_db)):
    inventory_items = (
        db.query(Inventory)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .all()
    )

    result = []

    for item in inventory_items:
        result.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "low_stock_threshold": item.low_stock_threshold,
                "shortage": max(
                    item.low_stock_threshold - item.quantity,
                    0,
                ),
            }
        )

    return {
        "success": True,
        "count": len(result),
        "low_stock": result,
    }