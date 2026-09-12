from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    success: bool
    message: str
    intent: str
    product: str | None = None
    size: str | None = None
    color: str | None = None
    quantity: int | None = None
    delivery_city: str | None = None
    next_agent: str | None = None