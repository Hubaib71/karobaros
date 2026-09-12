from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.agent_activity import get_recent_agent_activity

router = APIRouter(
    prefix="/api/agent-activity",
    tags=["Agent Activity"],
)


@router.get("/")
def get_agent_activity(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    activities = get_recent_agent_activity(db, limit)

    return {
        "success": True,
        "count": len(activities),
        "activities": [
            {
                "id": activity.id,
                "agent_name": activity.agent_name,
                "action": activity.action,
                "status": activity.status,
                "details": activity.details,
                "created_at": activity.created_at,
            }
            for activity in activities
        ],
    }
