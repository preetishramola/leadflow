"""Database access for leads and discussions. Routers stay HTTP-only; queries live here."""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Discussion, Lead, LeadStatus
from app.schemas import DiscussionCreate, LeadCreate, LeadRead, StatusCounts


def _latest_discussion(column):
    return (
        select(column)
        .where(Discussion.lead_id == Lead.id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
        .limit(1)
        .correlate(Lead)
        .scalar_subquery()
    )


_last_note = _latest_discussion(Discussion.note).label("last_note")
_last_discussion_at = _latest_discussion(Discussion.created_at).label("last_discussion_at")


def _summary_query() -> Select:
    return select(Lead, _last_note, _last_discussion_at)


def _to_read(lead: Lead, last_note: str | None, last_discussion_at: datetime | None) -> LeadRead:
    return LeadRead.model_validate(lead).model_copy(
        update={"last_note": last_note, "last_discussion_at": last_discussion_at}
    )


def list_leads(db: Session, *, status: LeadStatus | None = None, search: str | None = None) -> list[LeadRead]:
    query = _summary_query()
    if status is not None:
        query = query.where(Lead.status == status)
    if search:
        query = query.where(Lead.name.icontains(search, autoescape=True))

    last_activity = func.coalesce(_latest_discussion(Discussion.created_at), Lead.created_at)
    query = query.order_by(last_activity.desc(), Lead.id.desc())

    return [_to_read(*row) for row in db.execute(query).all()]


def get_lead(db: Session, lead_id: int) -> Lead | None:
    return db.get(Lead, lead_id)


def get_lead_summary(db: Session, lead_id: int) -> LeadRead | None:
    row = db.execute(_summary_query().where(Lead.id == lead_id)).one_or_none()
    return _to_read(*row) if row else None


def create_lead(db: Session, payload: LeadCreate) -> Lead:
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    return lead


def update_lead(db: Session, lead: Lead, changes: dict) -> Lead:
    for field, value in changes.items():
        setattr(lead, field, value)
    db.commit()
    return lead


def list_discussions(db: Session, lead_id: int) -> Sequence[Discussion]:
    query = (
        select(Discussion)
        .where(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
    )
    return db.scalars(query).all()


def add_discussion(db: Session, lead: Lead, payload: DiscussionCreate) -> Discussion:
    """Log a discussion and, if a follow-up was given, move the lead's follow-up to it.

    Both writes happen in one transaction so the list never shows a note without
    its matching follow-up (or vice versa).
    """
    discussion = Discussion(lead_id=lead.id, note=payload.note, follow_up_at=payload.follow_up_at)
    db.add(discussion)
    if payload.follow_up_at is not None:
        lead.follow_up_at = payload.follow_up_at
    db.commit()
    return discussion


def status_counts(db: Session) -> StatusCounts:
    rows = db.execute(select(Lead.status, func.count()).group_by(Lead.status)).all()
    by_status = {status: 0 for status in LeadStatus}
    by_status.update({status: count for status, count in rows})
    return StatusCounts(total=sum(by_status.values()), by_status=by_status)
