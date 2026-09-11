from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer, Inventory, Order, OrderItem, Product
from app.schemas.order import OrderCreate

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).all()

    return {
        "success": True,
        "count": len(orders),
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


@router.post("/")
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(
        Customer.id == order_data.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    product = db.query(Product).filter(
        Product.id == order_data.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product.id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found",
        )

    if inventory.quantity < order_data.quantity:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Insufficient stock",
                "available": inventory.quantity,
                "requested": order_data.quantity,
            },
        )

    total_amount = float(product.price) * order_data.quantity

    order = Order(
        order_number="TEMP",
        customer_id=customer.id,
        status="pending_approval",
        total_amount=total_amount,
        delivery_city=order_data.delivery_city or customer.city,
    )

    db.add(order)
    db.flush()

    order.order_number = f"SH-{1000 + order.id}"

    order_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=order_data.quantity,
        unit_price=product.price,
        subtotal=total_amount,
    )

    db.add(order_item)
    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Order created successfully",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "customer_id": order.customer_id,
            "product_id": product.id,
            "quantity": order_data.quantity,
            "status": order.status,
            "total_amount": float(order.total_amount),
            "delivery_city": order.delivery_city,
        },
    }
@router.post("/{order_id}/approve")
def approve_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.status != "pending_approval":
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be approved. Current status: {order.status}",
        )

    order_items = db.query(OrderItem).filter(
        OrderItem.order_id == order.id
    ).all()

    for item in order_items:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id
        ).first()

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory record not found",
            )

        if inventory.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock at approval time",
            )

        inventory.quantity -= item.quantity

    order.status = "approved"

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Order approved successfully",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "total_amount": float(order.total_amount),
        },
    }