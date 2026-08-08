# app/routers/orchestrator.py
"""
Endpoint to trigger the Supervity Auto Orchestrator from the Command Center.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..security import get_current_user
from ..services.orchestrator import trigger_orchestrator

log = logging.getLogger(__name__)

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


class TriggerOrchestratorRequest(BaseModel):
    run_id: str
    visitor_activity_id: str
    prospect_id: str
    company_domain: str
    url: str
    duration: int
    activity_type: str
    source: str


@router.post("/trigger")
async def trigger(
    payload: TriggerOrchestratorRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Triggers the Orchestrator workflow with the given inputs.
    Persists the run and its result/error to the database.
    """
    try:
        result = await trigger_orchestrator(payload.model_dump(), db)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Orchestrator call failed: {str(e)}")