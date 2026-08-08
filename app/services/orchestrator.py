# app/services/orchestrator.py
"""
Service for triggering the Supervity Auto Orchestrator workflow
and persisting run results to the database.
"""

import logging
import os
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from ..models import OrchestratorRun

log = logging.getLogger(__name__)

SUPERVITY_API_KEY = os.getenv("SUPERVITY_API_KEY")
SUPERVITY_ORCHESTRATOR_ID = os.getenv("SUPERVITY_ORCHESTRATOR_ID")
SUPERVITY_ACTIVE_ORG = os.getenv("SUPERVITY_ACTIVE_ORG", "1-Stella Kai Ning Wong Workspace")
SUPERVITY_ACTIVE_TEAM = os.getenv("SUPERVITY_ACTIVE_TEAM", "Tako")
SUPERVITY_TEAM_KEY = os.getenv("SUPERVITY_TEAM_KEY", "Tako")
SUPERVITY_TIMEZONE = os.getenv("SUPERVITY_TIMEZONE", "Asia/Kuala_Lumpur")

EXECUTE_URL = "https://auto-workflow-api.supervity.ai/api/v1/workflow-runs/execute"


def _headers() -> dict:
    if not SUPERVITY_API_KEY:
        raise ValueError("SUPERVITY_API_KEY environment variable is not set")
    return {
        "Authorization": f"Bearer {SUPERVITY_API_KEY}",
        "x-source": "external",
        "x-active-org": SUPERVITY_ACTIVE_ORG,
        "x-active-team": SUPERVITY_ACTIVE_TEAM,
        "x-teamKey": SUPERVITY_TEAM_KEY,
        "x-user-timezone": SUPERVITY_TIMEZONE,
    }


async def trigger_orchestrator(inputs: dict, db: Session) -> dict:
    """
    Calls the Supervity Auto blocking execute endpoint to run the Orchestrator,
    then persists the result to the database.

    `inputs` should match whatever fields your Orchestrator's entry Operator
    (Visitor Intent Aggregator) expects, e.g.:
        {
            "run_id": "...",
            "visitor_activity_id": "...",
            "prospect_id": "...",
            "company_domain": "...",
            "url": "...",
            "duration": "60",
            "activity_type": "...",
            "source": "...",
        }
    """
    if not SUPERVITY_ORCHESTRATOR_ID:
        raise ValueError("SUPERVITY_ORCHESTRATOR_ID environment variable is not set")

    form_data = {"workflowId": SUPERVITY_ORCHESTRATOR_ID}
    for key, value in inputs.items():
        form_data[f"inputs[{key}]"] = str(value)

    run_record = OrchestratorRun(
        workflow_id=SUPERVITY_ORCHESTRATOR_ID,
        inputs=inputs,
        status="running",
        created_at=datetime.now(timezone.utc),
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                EXECUTE_URL,
                headers=_headers(),
                data=form_data,
            )
            response.raise_for_status()
            result = response.json()

        run_record.status = "completed"
        run_record.result = result
        run_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(run_record)

        return {
            "run_id": run_record.id,
            "status": run_record.status,
            "result": result,
        }

    except httpx.HTTPStatusError as e:
        log.error("Orchestrator call failed: %s - %s", e.response.status_code, e.response.text)
        run_record.status = "failed"
        run_record.error = f"{e.response.status_code}: {e.response.text}"
        run_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise

    except Exception as e:
        log.error("Orchestrator call failed unexpectedly: %s", str(e))
        run_record.status = "failed"
        run_record.error = str(e)
        run_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        raise