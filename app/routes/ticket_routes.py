from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import TicketUpdate, TicketCreate
from app.database import SessionLocal
from app.models import Ticket, User
from app.dependencies import get_current_user

router = APIRouter()

@router.post("/tickets")
def create_ticket(
    ticket: TicketCreate,
    current_user: User = Depends(get_current_user)
):
    db: Session = SessionLocal()
    try:
        new_ticket = Ticket(
            title=ticket.title,
            description=ticket.description,
            priority=ticket.priority,
            created_by=current_user.email
        )
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
        return {
            "message": "Ticket Created",
            "ticket_id": new_ticket.id
        }
    finally:
        db.close()
    
@router.get("/tickets")
def get_tickets(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        if current_user.role == "admin":
            tickets = db.query(Ticket).all()
        else:
            tickets = db.query(Ticket).filter(Ticket.created_by == current_user.email).all()
        return tickets
    finally:
        db.close()

@router.get("/tickets/{ticket_id}")
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Allow admins to read any ticket; customers only their own
        if current_user.role != "admin" and ticket.created_by != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

        return ticket
    finally:
        db.close()

@router.put("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: int,
    updated_ticket: TicketUpdate,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Check authorization
        if current_user.role != "admin" and ticket.created_by != current_user.email:
            raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

        # If customer, restrict status changes
        if current_user.role != "admin":
            if updated_ticket.status not in ["Open", "Closed", ticket.status]:
                raise HTTPException(status_code=403, detail="Customers can only reopen or close their own tickets")

        ticket.title = updated_ticket.title
        ticket.description = updated_ticket.description
        ticket.priority = updated_ticket.priority
        ticket.status = updated_ticket.status

        db.commit()
        return {"message": "Ticket Updated"}
    finally:
        db.close()

@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Only allow admins to delete tickets
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only administrators can delete tickets")

        db.delete(ticket)
        db.commit()
        return {"message": "Ticket Deleted"}
    finally:
        db.close()