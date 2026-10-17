"""Populate the database with sample leads and discussions.

    python -m app.seed           # only seeds an empty database
    python -m app.seed --reset   # wipes leads first, then seeds

Times are relative to "now" so the demo always has follow-ups due today,
some overdue, and some upcoming.
"""

import argparse
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select

from app.database import Base, SessionLocal, engine
from app.models import Discussion, Lead, LeadStatus, utcnow

# (name, company, phone, status, follow-up offset from now, [(days ago, note), ...])
SAMPLE_LEADS = [
    (
        "Ananya Iyer", "Brightline Logistics", "+91 98450 22113", LeadStatus.PROPOSAL_SENT,
        timedelta(hours=2),
        [
            (9, "Inbound from the website form. Runs ops for 40 trucks, wants route-level cost reports."),
            (6, "Discovery call. Current tool is spreadsheets + WhatsApp groups. Budget approved for Q4."),
            (2, "Sent proposal for the Growth plan, 12 seats. She'll loop in the CFO."),
        ],
    ),
    (
        "Rohit Bansal", "Kestrel Foods", "+91 99100 45781", LeadStatus.QUALIFIED,
        timedelta(minutes=50),
        [
            (5, "Met at the Bengaluru SaaS meetup. Interested in the reporting module."),
            (1, "Call went well. Needs SSO before they can sign. Asked product for a timeline."),
        ],
    ),
    (
        "Meera Kapoor", "Tidewater Clinics", None, LeadStatus.CONTACTED,
        timedelta(days=-2),
        [
            (4, "Left a voicemail, followed up by email with the one-pager."),
        ],
    ),
    (
        "Daniel Fernandes", "Orbit Studio", "+91 90040 77812", LeadStatus.NEW,
        None,
        [],
    ),
    (
        "Sana Qureshi", "Lumen Retail", "+91 98201 33094", LeadStatus.WON,
        None,
        [
            (21, "Referral from Ananya. Wants to replace their legacy CRM."),
            (14, "Demo with the regional managers. Strong yes from two of three."),
            (7, "Contract signed — 25 seats, annual. Handed off to onboarding."),
        ],
    ),
    (
        "Vikram Nair", "Pinecrest Realty", "+91 97311 50020", LeadStatus.LOST,
        None,
        [
            (12, "Intro call. Small team, mostly price-sensitive."),
            (8, "Went with a cheaper competitor. Revisit next financial year."),
        ],
    ),
    (
        "Kavya Reddy", "Northstar Fintech", "+91 99860 11450", LeadStatus.CONTACTED,
        timedelta(days=3),
        [
            (3, "Cold outreach on LinkedIn, she replied asking for case studies."),
            (0.2, "Sent two case studies. Follow up after their sprint planning."),
        ],
    ),
]


def _ago(days: float) -> datetime:
    return utcnow() - timedelta(days=days)


def seed(reset: bool = False) -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if reset:
            db.execute(delete(Discussion))
            db.execute(delete(Lead))
        elif db.scalar(select(func.count()).select_from(Lead)):
            print("Database already has leads; skipping. Use --reset to start over.")
            return

        for name, company, phone, status, follow_up, notes in SAMPLE_LEADS:
            first_contact = notes[0][0] if notes else 1
            lead = Lead(
                name=name,
                company=company,
                phone=phone,
                status=status,
                follow_up_at=utcnow() + follow_up if follow_up is not None else None,
                created_at=_ago(first_contact + 0.1),
            )
            lead.discussions = [Discussion(note=note, created_at=_ago(days)) for days, note in notes]
            db.add(lead)

        db.commit()
        print(f"Seeded {len(SAMPLE_LEADS)} leads.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reset", action="store_true", help="delete existing leads before seeding")
    seed(reset=parser.parse_args().reset)
