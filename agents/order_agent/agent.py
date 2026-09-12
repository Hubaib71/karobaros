from sqlalchemy.orm import Session

from app.models import Customer, Inventory, Order, OrderItem, Product
from app.services.agent_activity import log_agent_activity


def create_pending_order(
    db: Session,
    customer_id: int,
    product_id: int,
    quantity: int,
    delivery_city: str | None = None,
):
    log_agent_activity(
        db=db,
        agent_name="Order Agent",
        action="order_creation",
        status="started",
        details=f"Creating order for customer {customer_id}, product {product_id}, quantity {quantity}",
    )

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        log_agent_activity(
            db=db,
            agent_name="Order Agent",
            action="order_creation",
            status="failed",
            details="Customer not found",
        )

        return {
            "success": False,
            "message": "Customer not found",
        }

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        log_agent_activity(
            db=db,
            agent_name="Order Agent",
            action="order_creation",
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
            agent_name="Order Agent",
            action="order_creation",
            status="failed",
            details="Inventory record not found",
        )

        return {
            "success": False,
            "message": "Inventory record not found",
        }

    if inventory.quantity < quantity:
        log_agent_activity(
            db=db,
            agent_name="Order Agent",
            action="order_creation",
            status="failed",
            details=f"Insufficient stock: {inventory.quantity} available, {quantity} requested",
        )

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

    log_agent_activity(
        db=db,
        agent_name="Order Agent",
        action="order_creation",
        status="completed",
        details=f"{order.order_number} created for Rs {total_amount:.0f}; awaiting human approval",
    )

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
