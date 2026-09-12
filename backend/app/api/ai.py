from fastapi import APIRouter

from agents.orchestrator.graph import orchestrator
from app.schemas.chat import ChatRequest, ChatResponse


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


def build_ai_response(result: dict) -> str:
    intent = result.get("intent")
    sales_result = result.get("sales_result", {})
    inventory_result = result.get("inventory_result", {})
    order_result = result.get("order_result", {})

    if not intent:
        return "I could not understand the request."

    if intent.intent == "unknown":
        return (
            "I can help with products, inventory, orders, and sales. "
            "Please tell me what you need."
        )

    # Product was not found
    if sales_result and not sales_result.get("success"):
        message = sales_result.get("message")

        if message == "Insufficient stock":
            available = sales_result.get("available", 0)
            requested = sales_result.get("requested", intent.quantity)
            shortage = sales_result.get("shortage", 0)

            return (
                f"Sorry, only {available} units are available, "
                f"but you requested {requested}. "
                f"We are short by {shortage} units."
            )

        return sales_result.get(
            "message",
            "I could not process the product request.",
        )

    # Inventory shortage
    if inventory_result and not inventory_result.get("sufficient"):
        shortage = inventory_result.get("shortage", 0)

        return (
            f"Stock is insufficient. "
            f"We are short by {shortage} units. "
            f"I recommend restocking {shortage} units."
        )

    # Order successfully created
    if order_result and order_result.get("success"):
        product = sales_result.get("product", intent.product)
        quantity = intent.quantity
        total = sales_result.get("total_amount", 0)
        order_number = order_result.get("order_number")
        city = intent.delivery_city or order_result.get("delivery_city")

        return (
            f"Order {order_number} is ready for approval. "
            f"{quantity} × {product} for Rs. {total:,.0f}. "
            f"Delivery: {city}."
        )

    # Sales result without order
    if sales_result.get("success"):
        product = sales_result.get("product", intent.product)
        quantity = intent.quantity
        total = sales_result.get("total_amount", 0)

        return (
            f"{quantity} × {product} is available. "
            f"Total: Rs. {total:,.0f}."
        )

    return "Your request was processed."


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = orchestrator.invoke(
        {
            "message": request.message,
            "customer_id": request.customer_id,
        }
    )

    intent = result.get("intent")
    next_agent = result.get("next_agent")

    ai_message = build_ai_response(result)

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
    )