from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Customer

router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


@router.get("/")
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()

    return {
        "success": True,
        "count": len(customers),
        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "city": customer.city,
            }
            for customer in customers
        ],
    }