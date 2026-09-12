from sqlalchemy.orm import Session

from app.models import Customer, Inventory, Order, OrderItem, Product


def get_business_summary(db: Session):
    total_orders = db.query(Order).count()

    approved_orders = (
        db.query(Order)
        .filter(Order.status == "approved")
        .all()
    )

    pending_orders = (
        db.query(Order)
        .filter(Order.status == "pending_approval")
        .count()
    )

    total_sales = sum(
        float(order.total_amount)
        for order in approved_orders
    )

    average_order_value = (
        total_sales / len(approved_orders)
        if approved_orders
        else 0
    )

    low_stock_items = (
        db.query(Inventory)
        .filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        )
        .all()
    )

    top_product = None

    approved_order_ids = [
        order.id for order in approved_orders
    ]

    if approved_order_ids:
        order_items = (
            db.query(OrderItem)
            .filter(
                OrderItem.order_id.in_(approved_order_ids)
            )
            .all()
        )

        product_sales = {}

        for item in order_items:
            product_sales[item.product_id] = (
                product_sales.get(item.product_id, 0)
                + item.quantity
            )

        if product_sales:
            top_product_id = max(
                product_sales,
                key=product_sales.get,
            )

            product = (
                db.query(Product)
                .filter(Product.id == top_product_id)
                .first()
            )

            if product:
                top_product = {
                    "product_id": product.id,
                    "product": product.name,
                    "sku": product.sku,
                    "units_sold": product_sales[top_product_id],
                }

    return {
        "total_orders": total_orders,
        "approved_orders": len(approved_orders),
        "pending_orders": pending_orders,
        "total_sales": total_sales,
        "average_order_value": average_order_value,
        "total_customers": db.query(Customer).count(),
        "low_stock_count": len(low_stock_items),
        "low_stock_products": [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "threshold": item.low_stock_threshold,
            }
            for item in low_stock_items
        ],
        "top_product": top_product,
    }
