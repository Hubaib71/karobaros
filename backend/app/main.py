from fastapi import FastAPI

from app.api.products import router as products_router
from app.api.inventory import router as inventory_router
from app.api.customers import router as customers_router
from app.api.orders import router as orders_router
from app.api.invoices import router as invoices_router

app = FastAPI(
    title="KarobarOS API",
    description="AI-powered operating system for small businesses",
    version="0.1.0",
)

app.include_router(products_router)
app.include_router(inventory_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(invoices_router)


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