from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Product

router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()

    return {
        "success": True,
        "count": len(products),
        "products": [
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "price": float(product.price),
            }
            for product in products
        ],
    }