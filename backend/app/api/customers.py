from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer, Order, Invoice, OrderItem, Product

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
@router.get("/{customer_id}/intelligence")
def get_customer_intelligence(
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

    approved_orders = [
        order for order in orders
        if order.status == "approved"
    ]

    total_spent = sum(
        float(order.total_amount)
        for order in approved_orders
    )

    order_ids = [order.id for order in approved_orders]

    product_stats = {}

    if order_ids:
        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id.in_(order_ids))
            .all()
        )

        product_ids = list(
            {item.product_id for item in order_items}
        )

        products = {}

        if product_ids:
            product_rows = (
                db.query(Product)
                .filter(Product.id.in_(product_ids))
                .all()
            )

            products = {
                product.id: product
                for product in product_rows
            }

        for item in order_items:
            product = products.get(item.product_id)

            if not product:
                continue

            if item.product_id not in product_stats:
                product_stats[item.product_id] = {
                    "product_id": product.id,
                    "product": product.name,
                    "sku": product.sku,
                    "units": 0,
                    "spent": 0,
                }

            product_stats[item.product_id]["units"] += item.quantity
            product_stats[item.product_id]["spent"] += float(
                item.subtotal
            )

    purchased_products = sorted(
        product_stats.values(),
        key=lambda item: item["units"],
        reverse=True,
    )

    favorite_product = (
        purchased_products[0]
        if purchased_products
        else None
    )

    last_purchase = (
        approved_orders[0].created_at
        if approved_orders
        else None
    )

    if favorite_product:
        insight = (
            f"{customer.name} is a repeat customer who frequently "
            f"purchases {favorite_product['product']}. "
            f"Consider recommending this product again or suggesting "
            f"a related product."
        )

        next_action = (
            f"Recommend {favorite_product['product']} "
            f"on the next interaction."
        )
    elif approved_orders:
        insight = (
            f"{customer.name} has completed {len(approved_orders)} "
            f"approved order(s) with KarobarOS."
        )

        next_action = "Recommend products based on the latest order."
    else:
        insight = (
            f"{customer.name} has not completed an approved order yet."
        )

        next_action = "Follow up and help create the first order."

    return {
        "success": True,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "city": customer.city,
        },
        "summary": {
            "total_orders": len(orders),
            "approved_orders": len(approved_orders),
            "total_spent": total_spent,
            "favorite_product": (
                favorite_product["product"]
                if favorite_product
                else None
            ),
            "last_purchase": last_purchase,
        },
        "products": purchased_products,
        "ai_insight": insight,
        "next_action": next_action,
    }
