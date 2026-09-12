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

        return (
            f"Ji, {quantity} × {product} available hain. "
            f"Total Rs. {total:,.0f} hai."
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