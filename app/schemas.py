from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str

class TicketUpdate(BaseModel):
    title: str
    description: str
    priority: str
    status: str