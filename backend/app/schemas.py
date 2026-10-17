import re
from datetime import datetime, timedelta
from typing import Annotated

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from app.models import LeadStatus, utcnow

# Allow a little clock drift between the browser and the server.
FOLLOW_UP_GRACE = timedelta(minutes=5)


def _blank_to_none(value: object) -> object:
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _required(label: str):
    def check(value: str) -> str:
        if not value:
            raise ValueError(f"{label} is required.")
        return value

    return check


_PHONE_RE = re.compile(r"^\+?[0-9()\-.\s]{3,30}$")


def _valid_phone(value: str) -> str:
    if not _PHONE_RE.fullmatch(value):
        raise ValueError("Use digits, spaces and + ( ) - only.")
    return value


def _not_in_past(value: datetime | None) -> datetime | None:
    if value is not None and value < utcnow() - FOLLOW_UP_GRACE:
        raise ValueError("Follow-up time must be in the future.")
    return value


Name = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120), AfterValidator(_required("Name"))]
Company = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]
Phone = Annotated[str, StringConstraints(strip_whitespace=True, max_length=30), AfterValidator(_valid_phone)]
Note = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000), AfterValidator(_required("Note"))]
OptionalCompany = Annotated[Company | None, BeforeValidator(_blank_to_none)]
OptionalPhone = Annotated[Phone | None, BeforeValidator(_blank_to_none)]
FollowUp = Annotated[AwareDatetime | None, AfterValidator(_not_in_past)]


class LeadCreate(BaseModel):
    name: Name
    company: OptionalCompany = None
    phone: OptionalPhone = None
    status: LeadStatus = LeadStatus.NEW


class LeadUpdate(BaseModel):
    """Partial update. Only fields present in the request body are applied."""

    name: Name | None = None
    company: OptionalCompany = None
    phone: OptionalPhone = None
    status: LeadStatus | None = None
    follow_up_at: FollowUp = None

    @model_validator(mode="after")
    def _reject_null_required_fields(self) -> "LeadUpdate":
        for field in ("name", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"'{field}' cannot be null.")
        return self


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_note: str | None = None
    last_discussion_at: datetime | None = None


class DiscussionCreate(BaseModel):
    note: Note
    follow_up_at: FollowUp = None


class DiscussionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    created_at: datetime


class StatusCounts(BaseModel):
    total: int
    by_status: dict[LeadStatus, int] = Field(default_factory=dict)
