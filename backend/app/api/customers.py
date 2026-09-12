from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer, Order, Invoice

router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()

    return {
        "success": True,
        "count": len(customers),
        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "city": customer.city,
            }
            for customer in customers
        ],
    }

@router.get("/{customer_id}/history")
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    orders = (
        db.query(Order)
        .filter(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    history = []

    for order in orders:
        invoice = (
            db.query(Invoice)
            .filter(Invoice.order_id == order.id)
            .first()
        )

        history.append(
            {
                "order_id": order.id,
                "order_number": order.order_number,
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

    total_spent = sum(
        item["total_amount"]
        for item in history
        if item["status"] == "approved"
    )

    return {
        "success": True,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "city": customer.city,
        },
        "summary": {
            "total_orders": len(history),
            "approved_orders": sum(
                1
                for item in history
                if item["status"] == "approved"
            ),
            "total_spent": total_spent,
        },
        "orders": history,
    }
