from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Invoice, Order

router = APIRouter(
    prefix="/api/invoices",
    tags=["Invoices"],
)


@router.get("/")
def get_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).all()

    return {
        "success": True,
        "count": len(invoices),
        "invoices": [
            {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "order_id": invoice.order_id,
                "total_amount": float(invoice.total_amount),
                "status": invoice.status,
                "created_at": invoice.created_at,
            }
            for invoice in invoices
        ],
    }


@router.post("/{order_id}/generate")
def generate_invoice(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Invoice can only be generated for approved orders",
        )

    existing_invoice = db.query(Invoice).filter(
        Invoice.order_id == order.id
    ).first()

    if existing_invoice:
        return {
            "success": True,
            "message": "Invoice already exists",
            "invoice": {
                "id": existing_invoice.id,
                "invoice_number": existing_invoice.invoice_number,
                "order_id": existing_invoice.order_id,
                "total_amount": float(existing_invoice.total_amount),
                "status": existing_invoice.status,
            },
        }

    invoice = Invoice(
        invoice_number="TEMP",
        order_id=order.id,
        total_amount=order.total_amount,
        status="generated",
    )

    db.add(invoice)
    db.flush()

    invoice.invoice_number = f"INV-{1000 + invoice.id}"

    db.commit()
    db.refresh(invoice)

    return {
        "success": True,
        "message": "Invoice generated successfully",
        "invoice": {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "order_id": invoice.order_id,
            "total_amount": float(invoice.total_amount),
            "status": invoice.status,
        },
    }