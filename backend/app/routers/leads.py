from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import Lead, LeadStatus
from app.schemas import DiscussionCreate, DiscussionRead, LeadCreate, LeadRead, LeadUpdate, StatusCounts

router = APIRouter(prefix="/api/leads", tags=["leads"])

DbSession = Annotated[Session, Depends(get_db)]


def get_lead_or_404(lead_id: int, db: DbSession) -> Lead:
    lead = crud.get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Lead {lead_id} not found.")
    return lead


ExistingLead = Annotated[Lead, Depends(get_lead_or_404)]


@router.get("", response_model=list[LeadRead])
def list_leads(
    db: DbSession,
    status_filter: Annotated[LeadStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(max_length=120)] = None,
):
    return crud.list_leads(db, status=status_filter, search=(search or "").strip() or None)


@router.get("/counts", response_model=StatusCounts)
def lead_counts(db: DbSession):
    return crud.status_counts(db)


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: DbSession):
    lead = crud.create_lead(db, payload)
    return crud.get_lead_summary(db, lead.id)


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead: ExistingLead, db: DbSession):
    return crud.get_lead_summary(db, lead.id)


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(payload: LeadUpdate, lead: ExistingLead, db: DbSession):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No fields to update.")
    crud.update_lead(db, lead, changes)
    return crud.get_lead_summary(db, lead.id)


@router.get("/{lead_id}/discussions", response_model=list[DiscussionRead])
def list_discussions(lead: ExistingLead, db: DbSession):
    return crud.list_discussions(db, lead.id)


@router.post(
    "/{lead_id}/discussions",
    response_model=DiscussionRead,
    status_code=status.HTTP_201_CREATED,
)
def add_discussion(payload: DiscussionCreate, lead: ExistingLead, db: DbSession):
    return crud.add_discussion(db, lead, payload)
