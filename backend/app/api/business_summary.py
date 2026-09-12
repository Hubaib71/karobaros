from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.business_summary import get_business_summary

router = APIRouter(
    prefix="/api/business-summary",
    tags=["Business Summary"],
)


@router.get("/")
def business_summary(db: Session = Depends(get_db)):
    return {
        "success": True,
        "summary": get_business_summary(db),
    }
