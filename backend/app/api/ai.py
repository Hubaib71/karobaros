from fastapi import APIRouter
from sqlalchemy.orm import Session

from agents.orchestrator.graph import orchestrator
from app.db.session import SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.business_summary import get_business_summary, get_today_sales
from app.models import Customer, Order

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


def is_today_sales_request(message: str) -> bool:
    text = message.lower().strip()

    sales_words = [
        "today sales",
        "today's sales",
        "today sale",
        "aaj ki sales",
        "aaj ki sale",
        "aaj sales",
        "aaj sale",
        "aaj kitni sale",
        "aaj kitni sales",
        "today revenue",
        "aaj ka revenue",
        "how much did we sell today",
        "how much did we sell",
        "todays sales",
        "what are today's sales",
        "what are todays sales",
        "show today's sales",
        "show todays sales",
        "show today's revenue",
        "show todays revenue",
    ]

    return any(word in text for word in sales_words)


def build_today_sales_response(sales: dict, message: str) -> str:
    text = message.lower().strip()

    english_words = [
        "how much",
        "today",
        "sales",
        "sell",
        "revenue",
        "what are",
        "show",
    ]

    is_english = any(word in text for word in english_words)

    if is_english:
        return (
            f"Today's total sales are Rs. {sales['total_sales']:,.0f}. "
            f"{sales['approved_orders']} approved order(s) were completed today."
        )

    return (
        f"Ji, aaj ki total sales Rs. {sales['total_sales']:,.0f} hain. "
        f"Aaj {sales['approved_orders']} approved "
        f"order(s) complete hue hain."
    )


def is_low_stock_request(message: str) -> bool:
    text = message.lower().strip()

    stock_words = [
        "low stock",
        "low-stock",
        "lowstock",
        "restock",
        "stock kam",
        "stock khatam",
        "stock kitna kam",
        "kam stock",
        "inventory low",
        "which products need restocking",
        "kaun se products low stock",
        "kon se products low stock",
        "low stock batao",
        "which products are low in stock",
        "which products are low stock",
        "which products need restocking",
        "what products are low in stock",
        "what products are low stock",
        "show low stock products",
        "show me low stock",
        "show me low stock products",
        "which items need restocking",
        "what needs restocking",
    ]

    return any(word in text for word in stock_words)


def build_low_stock_response(db: Session, message: str) -> str:
    from app.models import Inventory, Product

    text = message.lower().strip()

    english_words = [
        "which",
        "what",
        "show",
        "products",
        "items",
        "need",
        "restocking",
        "low in stock",
        "low stock",
    ]

    is_english = any(word in text for word in english_words)

    low_stock_items = (
        db.query(Inventory, Product)
        .join(Product, Product.id == Inventory.product_id)
        .filter(Inventory.quantity <= Inventory.low_stock_threshold)
        .all()
    )

    if not low_stock_items:
        if is_english:
            return "There are currently no low-stock products."
        return "Ji, abhi koi product low stock nahi hai."

    if is_english:
        lines = [
            f"⚠️ {len(low_stock_items)} product(s) are currently low in stock:"
        ]

        for inventory, product in low_stock_items:
            shortage = max(
                inventory.low_stock_threshold - inventory.quantity,
                0,
            )
            lines.append(
                f"• {product.name} ({product.sku}): "
                f"{inventory.quantity} units available, "
                f"recommended restock: {shortage} units."
            )

        return "\n".join(lines)

    lines = [f"⚠️ {len(low_stock_items)} product(s) low stock hain:"]

    for inventory, product in low_stock_items:
        shortage = max(
            inventory.low_stock_threshold - inventory.quantity,
            0,
        )
        lines.append(
            f"• {product.name} ({product.sku}): "
            f"{inventory.quantity} units available, "
            f"recommended restock {shortage} units."
        )

    return "\n".join(lines)

def find_customer_from_message(db: Session, message: str):
    customers = db.query(Customer).all()
    text = message.lower()

    for customer in customers:
        if customer.name.lower() in text:
            return customer

    return None


def is_customer_request(message: str) -> bool:
    text = message.lower().strip()

    customer_words = [
        "customer history",
        "customer ka history",
        "customer ki history",
        "order history",
        "orders of",
        "orders for",
        "spent",
        "spend",
        "kitna kharcha",
        "kitna spend",
        "customer ne kitna",
        "customer ne kya order",
        "customer ke orders",
        "customer ki orders",
        "ke orders batao",
        "ke orders",
        "orders batao",
        "orders dikhao",
    ]

    return any(word in text for word in customer_words)


def build_customer_response(db: Session, message: str) -> str:
    customer = find_customer_from_message(db, message)

    if not customer:
        text = message.lower().strip()

        if any(word in text for word in [
            "how much",
            "spent",
            "spend",
            "orders",
            "order history",
            "customer history",
            "show",
        ]):
            return (
                "I couldn't identify the customer name in your message. "
                "Please provide the customer's name."
            )

        return (
            "Ji, customer ka naam message mein clear nahi mila. "
            "Please customer ka naam bata dein."
        )

    orders = (
        db.query(Order)
        .filter(Order.customer_id == customer.id)
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

    text = message.lower().strip()

    english_phrases = [
        "how much has",
        "how much did",
        "how much does",
        "how many orders",
        "show me",
        "show ",
        "what is",
        "what are",
        "customer history",
        "order history",
        "orders of",
        "orders for",
    ]

    is_english = any(phrase in text for phrase in english_phrases)

    if is_english:
        response = (
            f"{customer.name}'s customer history:\n\n"
            f"• City: {customer.city or 'N/A'}\n"
            f"• Total orders: {len(orders)}\n"
            f"• Approved orders: {len(approved_orders)}\n"
            f"• Total spent: Rs. {total_spent:,.0f}\n"
        )

        if orders:
            response += "\nRecent orders:\n"

            for order in orders[:5]:
                response += (
                    f"• {order.order_number} — "
                    f"{order.status} — "
                    f"Rs. {float(order.total_amount):,.0f}\n"
                )

        return response

    response = (
        f"Ji, {customer.name} ki customer history:\n\n"
        f"• City: {customer.city or 'N/A'}\n"
        f"• Total orders: {len(orders)}\n"
        f"• Approved orders: {len(approved_orders)}\n"
        f"• Total spent: Rs. {total_spent:,.0f}\n"
    )

    if orders:
        response += "\nRecent orders:\n"

        for order in orders[:5]:
            response += (
                f"• {order.order_number} — "
                f"{order.status} — "
                f"Rs. {float(order.total_amount):,.0f}\n"
            )

    return response

def is_business_summary_request(message: str) -> bool:
    text = message.lower().strip()

    summary_words = [
        "summary",
        "business summary",
        "daily summary",
        "today's summary",
        "today summary",
        "sales summary",
        "business report",
        "report",
        "aaj ka business",
        "aaj ka summary",
        "aaj ki summary",
        "aaj ka report",
        "business kaisa",
        "business kaise",
    ]

    return any(word in text for word in summary_words)


def build_business_summary_response(summary: dict) -> str:
    top_product = summary.get("top_product")

    response = (
        "Ji, yeh KarobarOS ka business summary hai:\n\n"
        f"• Total sales: Rs. {summary['total_sales']:,.0f}\n"
        f"• Total orders: {summary['total_orders']}\n"
        f"• Approved orders: {summary['approved_orders']}\n"
        f"• Pending orders: {summary['pending_orders']}\n"
        f"• Average order value: Rs. {summary['average_order_value']:,.0f}\n"
        f"• Customers: {summary['total_customers']}\n"
        f"• Low-stock products: {summary['low_stock_count']}\n"
    )

    if top_product:
        response += (
            f"\nTop-selling product: {top_product['product']} "
            f"({top_product['units_sold']} units sold)."
        )

    low_stock_products = summary.get("low_stock_products", [])

    if low_stock_products:
        response += (
            "\n\n⚠️ Low-stock alert: "
            f"{len(low_stock_products)} product needs attention."
        )

    return response


def is_english_message(message: str) -> bool:
    text = message.lower().strip()

    roman_urdu_markers = [
        "chahiye", "ke liye", "hain", "hai", "batao", "bata dein",
        "kitna", "kitni", "aaj", "kaun", "kon", "mujhe", "ne",
        "kiya", "karna", "karo", "dein", "chahta", "chahti",
        "milega", "mil sakta", "delivery ke",
    ]

    english_phrases = [
        "i want", "i need", "can i get", "please give", "i'd like",
        "i would like", "deliver to", "delivered to", "how much",
        "which", "what are", "show me", "buy ", "purchase",
    ]

    if any(marker in text for marker in roman_urdu_markers):
        return False

    return any(phrase in text for phrase in english_phrases)


def build_ai_response(result: dict, message: str) -> str:
    is_english = is_english_message(message)
    intent = result.get("intent")
    sales_result = result.get("sales_result", {})
    inventory_result = result.get("inventory_result", {})
    order_result = result.get("order_result", {})

    if not intent:
        return "I could not understand the request."

    if intent.intent == "unknown":
        return (
            "Ji, main products, inventory aur orders mein help kar sakta hoon. "
            "Please product, quantity aur size bata dein."
        )

    if sales_result and not sales_result.get("success"):
        message = sales_result.get("message")

        if message == "Insufficient stock":
            available = sales_result.get("available", 0)
            requested = sales_result.get("requested", intent.quantity)
            shortage = sales_result.get("shortage", 0)

            product = sales_result.get(
                "product",
                intent.product,
            )

            if is_english:
                return (
                    f"Sorry, only {available} units of {product} are available. "
                    f"You requested {requested} units, so there is a shortage of "
                    f"{shortage} units. Recommended restock: {shortage} units."
                )

            return (
                f"Sorry, {product} ke sirf {available} units available hain. "
                f"Aap ne {requested} units request ki hain, is liye "
                f"{shortage} units ki kami hai. "
                f"Recommended restock: {shortage} units."
            )

        return sales_result.get(
            "message",
            "I could not process the product request.",
        )

    if inventory_result and not inventory_result.get("sufficient"):
        shortage = inventory_result.get("shortage", 0)

        return (
            f"Stock insufficient hai. "
            f"{shortage} units ki kami hai. "
            f"Main {shortage} units restock karne ki recommendation deta hoon."
        )

    if order_result and order_result.get("success"):
        product = sales_result.get(
            "product",
            intent.product,
        )

        quantity = intent.quantity

        total = sales_result.get(
            "total_amount",
            0,
        )

        order_number = order_result.get(
            "order_number",
            "N/A",
        )

        city = (
            intent.delivery_city
            or order_result.get("delivery_city")
            or "customer location"
        )

        if is_english:
            return (
                f"Yes, {quantity} × {product} are available. "
                f"The total is Rs. {total:,.0f}. "
                f"Order {order_number} is ready for approval for delivery to {city}."
            )

        return (
            f"Ji, {quantity} × {product} available hain. "
            f"Total Rs. {total:,.0f} hai. "
            f"{city} delivery ke liye order {order_number} "
            f"approval ke liye ready hai."
        )

    if sales_result.get("success"):
        product = sales_result.get(
            "product",
            intent.product,
        )

        quantity = intent.quantity

        total = sales_result.get(
            "total_amount",
            0,
        )

        if is_english:
            return (
                f"Yes, {quantity} × {product} are available. "
                f"The total is Rs. {total:,.0f}."
            )

        return (
            f"Ji, {quantity} × {product} available hain. "
            f"Total Rs. {total:,.0f} hai."
        )

    return "Your request was processed."


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if is_customer_request(request.message):
        db: Session = SessionLocal()

        try:
            response = build_customer_response(db, request.message)
        finally:
            db.close()

        return ChatResponse(
            success=True,
            message=response,
            customer_id=request.customer_id,
            intent="customer_intelligence",
            product=None,
            size=None,
            color=None,
            quantity=None,
            delivery_city=None,
            next_agent="customer_agent",
            restock_recommendation=None,
        )

    if is_low_stock_request(request.message):
        db: Session = SessionLocal()

        try:
            response = build_low_stock_response(db, request.message)
        finally:
            db.close()

        return ChatResponse(
            success=True,
            message=response,
            customer_id=request.customer_id,
            intent="low_stock",
            product=None,
            size=None,
            color=None,
            quantity=None,
            delivery_city=None,
            next_agent="inventory_agent",
            restock_recommendation=None,
        )

    if is_today_sales_request(request.message):
        db: Session = SessionLocal()

        try:
            sales = get_today_sales(db)
        finally:
            db.close()

        return ChatResponse(
            success=True,
            message=build_today_sales_response(sales, request.message),
            customer_id=request.customer_id,
            intent="today_sales",
            product=None,
            size=None,
            color=None,
            quantity=None,
            delivery_city=None,
            next_agent="business_intelligence",
            restock_recommendation=None,
        )

    if is_business_summary_request(request.message):
        db: Session = SessionLocal()

        try:
            summary = get_business_summary(db)
        finally:
            db.close()

        return ChatResponse(
            success=True,
            message=build_business_summary_response(summary),
            customer_id=request.customer_id,
            intent="business_summary",
            product=None,
            size=None,
            color=None,
            quantity=None,
            delivery_city=None,
            next_agent="business_summary",
            restock_recommendation=None,
        )

    result = orchestrator.invoke(
        {
            "message": request.message,
            "customer_id": request.customer_id,
        }
    )

    intent = result.get("intent")
    next_agent = result.get("next_agent")

    ai_message = build_ai_response(result, request.message)

    restock_recommendation = None

    sales_result = result.get("sales_result", {})
    inventory_result = result.get("inventory_result", {})

    if (
        sales_result
        and not sales_result.get("success")
        and sales_result.get("message") == "Insufficient stock"
    ):
        available = sales_result.get("available", 0)
        requested = sales_result.get(
            "requested",
            intent.quantity or 0,
        )
        shortage = sales_result.get("shortage", 0)

        restock_recommendation = {
            "product_id": sales_result.get("product_id"),
            "product": sales_result.get(
                "product",
                intent.product,
            ),
            "sku": sales_result.get("sku", ""),
            "current_quantity": available,
            "requested_quantity": requested,
            "shortage": shortage,
            "recommended_quantity": shortage,
            "reason": f"Short by {shortage} units",
        }

    elif (
        inventory_result
        and not inventory_result.get("sufficient")
    ):
        shortage = inventory_result.get("shortage", 0)

        restock_recommendation = {
            "product_id": inventory_result.get("product_id"),
            "product": inventory_result.get(
                "product",
                intent.product,
            ),
            "sku": inventory_result.get("sku", ""),
            "current_quantity": inventory_result.get(
                "available",
                0,
            ),
            "requested_quantity": inventory_result.get(
                "requested",
                intent.quantity or 0,
            ),
            "shortage": shortage,
            "recommended_quantity": shortage,
            "reason": f"Short by {shortage} units",
        }

    return ChatResponse(
        success=True,
        message=ai_message,
        customer_id=request.customer_id,
        intent=intent.intent,
        product=intent.product,
        size=intent.size,
        color=intent.color,
        quantity=intent.quantity,
        delivery_city=intent.delivery_city,
        next_agent=next_agent,
        restock_recommendation=restock_recommendation,
    )
