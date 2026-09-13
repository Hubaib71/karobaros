from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    Customer, Order, Product, OrderItem, Inventory, Invoice
)

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

@router.get("/sales-overview")
def get_sales_overview(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)

    approved_orders = (
        db.query(Order)
        .filter(Order.status == "approved")
        .all()
    )

    daily_sales = {}

    for order in approved_orders:
        order_date = order.created_at.date()

        if start_date <= order_date <= today:
            daily_sales[order_date] = (
                daily_sales.get(order_date, 0)
                + float(order.total_amount)
            )

    result = []

    for offset in range(7):
        day = start_date + timedelta(days=offset)

        result.append(
            {
                "date": day.isoformat(),
                "sales": daily_sales.get(day, 0),
            }
        )

    return {
        "success": True,
        "sales": result,
    }
@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db)):
    from sqlalchemy import func

    rows = (
        db.query(
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.subtotal).label("sales"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == "approved")
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return {
        "success": True,
        "products": [
            {
                "name": row.name,
                "sku": row.sku,
                "units_sold": int(row.units_sold or 0),
                "sales": float(row.sales or 0),
            }
            for row in rows
        ],
    }
@router.get("/sales-intelligence")
def get_sales_intelligence(
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.status == "approved")
        .order_by(Order.created_at.desc())
        .all()
    )

    total_sales = sum(
        float(order.total_amount)
        for order in orders
    )

    total_orders = len(orders)

    average_order_value = (
        total_sales / total_orders
        if total_orders
        else 0
    )

    # -------------------------
    # Product performance
    # -------------------------

    product_stats = {}

    order_ids = [order.id for order in orders]

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
                    "sales": 0,
                }

            product_stats[item.product_id]["units"] += item.quantity
            product_stats[item.product_id]["sales"] += float(
                item.subtotal
            )

    top_products = sorted(
        product_stats.values(),
        key=lambda item: item["sales"],
        reverse=True,
    )

    # -------------------------
    # Customer performance
    # -------------------------

    customer_stats = {}

    for order in orders:
        if order.customer_id not in customer_stats:
            customer = (
                db.query(Customer)
                .filter(Customer.id == order.customer_id)
                .first()
            )

            customer_stats[order.customer_id] = {
                "customer_id": order.customer_id,
                "customer": (
                    customer.name
                    if customer
                    else "Unknown"
                ),
                "orders": 0,
                "spent": 0,
            }

        customer_stats[order.customer_id]["orders"] += 1
        customer_stats[order.customer_id]["spent"] += float(
            order.total_amount
        )

    top_customers = sorted(
        customer_stats.values(),
        key=lambda item: item["spent"],
        reverse=True,
    )

    # -------------------------
    # Business insights
    # -------------------------

    insights = []

    if top_products:
        best_product = top_products[0]

        insights.append(
            f"{best_product['product']} is the top-selling product "
            f"with {best_product['units']} units sold."
        )

    if top_customers:
        best_customer = top_customers[0]

        insights.append(
            f"{best_customer['customer']} is the highest-value "
            f"customer with Rs. {best_customer['spent']:,.0f} "
            f"in approved purchases."
        )

    if average_order_value > 0:
        insights.append(
            f"Average approved order value is "
            f"Rs. {average_order_value:,.0f}."
        )

    # -------------------------
    # AI recommendations
    # -------------------------

    recommendations = []

    if top_products:
        recommendations.append(
            f"Keep {top_products[0]['product']} well stocked "
            f"because it generates the highest sales."
        )

    if top_customers:
        recommendations.append(
            f"Create a personalized offer for "
            f"{top_customers[0]['customer']} based on their "
            f"purchase history."
        )

    if not recommendations:
        recommendations.append(
            "Generate more approved orders to unlock stronger "
            "AI business recommendations."
        )

    return {
        "success": True,
        "summary": {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "average_order_value": average_order_value,
        },
        "top_products": top_products[:5],
        "top_customers": top_customers[:5],
        "insights": insights,
        "recommendations": recommendations,
    }
