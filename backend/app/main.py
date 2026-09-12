import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.products import router as products_router
from app.api.inventory import router as inventory_router
from app.api.customers import router as customers_router
from app.api.orders import router as orders_router
from app.api.invoices import router as invoices_router
from app.api.ai import router as ai_router
from app.api.dashboard import router as dashboard_router
from app.api.business_summary import router as business_summary_router
from app.api.agent_activity import router as agent_activity_router

app = FastAPI(
    title="KarobarOS API",
    description="AI-powered operating system for small businesses",
    version="0.1.0",
)


# Allow the Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(invoices_router)
app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(business_summary_router)
app.include_router(agent_activity_router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "KarobarOS API is running",
        "version": "0.1.0",
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
    }