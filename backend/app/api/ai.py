from fastapi import APIRouter

from agents.orchestrator.graph import orchestrator
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = orchestrator.invoke({
        "message": request.message,
    })

    intent = result.get("intent")
    next_agent = result.get("next_agent")

    return ChatResponse(
        success=True,
        message="Message processed successfully",
        intent=intent.intent,
        product=intent.product,
        size=intent.size,
        color=intent.color,
        quantity=intent.quantity,
        delivery_city=intent.delivery_city,
        next_agent=next_agent,
    )