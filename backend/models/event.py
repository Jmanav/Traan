from sqlalchemy import Column, Text, VARCHAR, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text, TIMESTAMP
from backend.models import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    agent_name = Column(VARCHAR(30))
    action = Column(Text)
    payload = Column(JSONB, nullable=True)
    outcome = Column(Text, nullable=True)
    logged_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
