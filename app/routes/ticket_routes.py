from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas import TicketUpdate
from app.database import SessionLocal
from app.models import Ticket
from app.schemas import TicketCreate

router = APIRouter()

@router.post("/tickets")
def create_ticket(ticket: TicketCreate):

    db: Session = SessionLocal()

    new_ticket = Ticket(
        title=ticket.title,
        description=ticket.description,
        priority=ticket.priority,
        created_by="Pratham"
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    return {
        "message": "Ticket Created",
        "ticket_id": new_ticket.id
    }
    
@router.get("/tickets")
def get_tickets():

    db = SessionLocal()

    tickets = db.query(Ticket).all()

    return tickets

@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int):

    db = SessionLocal()

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        return {"message": "Ticket not found"}

    return ticket

@router.put("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: int,
    updated_ticket: TicketUpdate
):

    db = SessionLocal()

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        return {"message": "Ticket not found"}

    ticket.title = updated_ticket.title
    ticket.description = updated_ticket.description
    ticket.priority = updated_ticket.priority
    ticket.status = updated_ticket.status

    db.commit()

    return {"message": "Ticket Updated"}

@router.delete("/tickets/{ticket_id}")
def delete_ticket(ticket_id: int):

    db = SessionLocal()

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        return {"message": "Ticket not found"}

    db.delete(ticket)
    db.commit()

    return {"message": "Ticket Deleted"}