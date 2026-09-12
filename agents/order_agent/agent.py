from sqlalchemy.orm import Session

from app.models import Customer, Inventory, Order, OrderItem, Product


def create_pending_order(
    db: Session,
    customer_id: int,
    product_id: int,
    quantity: int,
    delivery_city: str | None = None,
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        return {
            "success": False,
            "message": "Customer not found",
        }

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
        }

    if inventory.quantity < quantity:
        return {
            "success": False,
            "message": "Insufficient stock",
            "available": inventory.quantity,
            "requested": quantity,
            "shortage": quantity - inventory.quantity,
        }

    total_amount = float(product.price) * quantity

    order = Order(
        order_number="TEMP",
        customer_id=customer_id,
        status="pending_approval",
        total_amount=total_amount,
        delivery_city=delivery_city or customer.city,
    )

    db.add(order)
    db.flush()

    order.order_number = f"SH-{1000 + order.id}"

    order_item = OrderItem(
        order_id=order.id,
        product_id=product_id,
        quantity=quantity,
        unit_price=product.price,
        subtotal=total_amount,
    )

    db.add(order_item)
    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Pending order created",
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_id": customer_id,
        "product_id": product_id,
        "quantity": quantity,
        "status": order.status,
        "total_amount": total_amount,
        "delivery_city": order.delivery_city,
    }