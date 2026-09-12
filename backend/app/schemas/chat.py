from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    customer_id: int = 1


class RestockRecommendation(BaseModel):
    product_id: int
    product: str
    sku: str
    current_quantity: int
    requested_quantity: int
    shortage: int
    recommended_quantity: int
    reason: str


class ChatResponse(BaseModel):
    success: bool
    message: str
    customer_id: int
    intent: str
    product: str | None = None
    size: str | None = None
    color: str | None = None
    quantity: int | None = None
    delivery_city: str | None = None
    next_agent: str | None = None
    restock_recommendation: RestockRecommendation | None = None