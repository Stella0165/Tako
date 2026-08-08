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

@router.get("/stats")
def get_dashboard_stats(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    from ..models import OrchestratorRun

    total_runs = db.query(func.count(OrchestratorRun.id)).scalar() or 0
    completed_runs = db.query(func.count(OrchestratorRun.id)).filter(OrchestratorRun.status == "completed").scalar() or 0
    failed_runs = db.query(func.count(OrchestratorRun.id)).filter(OrchestratorRun.status == "failed").scalar() or 0
    running_runs = db.query(func.count(OrchestratorRun.id)).filter(OrchestratorRun.status == "running").scalar() or 0
    success_rate = round((completed_runs / total_runs) * 100) if total_runs > 0 else 0

    recent_runs = db.query(OrchestratorRun).order_by(OrchestratorRun.created_at.desc()).limit(10).all()

    return {
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "failed_runs": failed_runs,
        "running_runs": running_runs,
        "success_rate": success_rate,
        "recent_runs": [
            {"id": r.id, "status": r.status, "created_at": r.created_at.isoformat() if r.created_at else None, "completed_at": r.completed_at.isoformat() if r.completed_at else None}
            for r in recent_runs
        ],
    }