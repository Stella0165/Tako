# app/models/orchestrator_run.py
"""
Database model for tracking Supervity Orchestrator runs.
"""

from sqlalchemy import Column, DateTime, Integer, String, JSON
from ..core.database import Base


class OrchestratorRun(Base):
    __tablename__ = "orchestrator_runs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String, nullable=False)
    inputs = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="running")  # running | completed | failed
    result = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)