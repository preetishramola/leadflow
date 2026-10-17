import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import Base, engine
from app.routers import leads

logger = logging.getLogger("leadflow")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Small project: create tables on boot. A real deployment would use Alembic migrations.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="LeadFlow API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Flatten Pydantic errors into `{detail, errors: {field: message}}` so the UI can show them inline."""
    errors: dict[str, str] = {}
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
        field = ".".join(location) or "request"
        message = error["msg"].removeprefix("Value error, ")
        errors.setdefault(field, message)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "Some fields are invalid.", "errors": errors},
    )


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database error", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong while saving. Please try again."},
    )


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(leads.router)
