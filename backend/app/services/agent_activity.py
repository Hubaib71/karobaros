from sqlalchemy.orm import Session

from app.models import AgentActivity


def log_agent_activity(
    db: Session,
    agent_name: str,
    action: str,
    status: str = "completed",
    details: str | None = None,
):
    activity = AgentActivity(
        agent_name=agent_name,
        action=action,
        status=status,
        details=details,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


def get_recent_agent_activity(
    db: Session,
    limit: int = 20,
):
    return (
        db.query(AgentActivity)
        .order_by(AgentActivity.created_at.desc())
        .limit(limit)
        .all()
    )
