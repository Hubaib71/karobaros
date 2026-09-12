from sqlalchemy.orm import Session

from app.models import Inventory, Product


COLOR_TO_SKU = {
    "black": "BLK",
    "white": "WHT",
    "navy": "NAV",
    "grey": "GRY",
    "gray": "GRY",
    "blue": "BLU",
}


def find_product(
    db: Session,
    product_name: str,
    size: str | None = None,
    color: str | None = None,
):
    products = db.query(Product).filter(
        Product.name.ilike(product_name)
    ).all()

    if not products:
        return None, "Product not found"

    # Match size/color through exact SKU tokens.
    # Example: TSH-BLK-L = T-shirt / Black / L
    for product in products:
        sku_parts = product.sku.upper().split("-")

        if size and size.upper() not in sku_parts:
            continue

        if color:
            expected_color_code = COLOR_TO_SKU.get(color.lower())

            if expected_color_code and expected_color_code not in sku_parts:
                continue

        return product, None

    return None, "Requested product variant not found"


def check_product_stock(
    db: Session,
    product: Product,
    quantity: int,
):
    inventory = db.query(Inventory).filter(
        Inventory.product_id == product.id
    ).first()

    if not inventory:
        return {
            "available": 0,
            "sufficient": False,
            "shortage": quantity,
        }

    available = inventory.quantity

    return {
        "available": available,
        "sufficient": available >= quantity,
        "shortage": max(quantity - available, 0),
    }


def process_sales_request(
    db: Session,
    product_name: str,
    quantity: int,
    size: str | None = None,
    color: str | None = None,
):
    product, error = find_product(
        db=db,
        product_name=product_name,
        size=size,
        color=color,
    )

    if error:
        return {
            "success": False,
            "message": error,
        }

    stock = check_product_stock(
        db=db,
        product=product,
        quantity=quantity,
    )

    if not stock["sufficient"]:
        return {
            "success": False,
            "message": "Insufficient stock",
            "product_id": product.id,
            "product": product.name,
            "sku": product.sku,
            "available": stock["available"],
            "requested": quantity,
            "shortage": stock["shortage"],
        }

    total_amount = float(product.price) * quantity

    return {
        "success": True,
        "product_id": product.id,
        "product": product.name,
        "sku": product.sku,
        "quantity": quantity,
        "unit_price": float(product.price),
        "total_amount": total_amount,
        "available": stock["available"],
        "remaining_after_order": stock["available"] - quantity,
    }