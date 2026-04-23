from sqlalchemy import Column, VARCHAR, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text, TIMESTAMP
from backend.models import Base


class Dispatch(Base):
    __tablename__ = "dispatches"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"))
    status = Column(VARCHAR(20), server_default="sent")
    dispatched_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    confirmed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    arrived_at = Column(TIMESTAMP(timezone=True), nullable=True)
    approach_route = Column(JSONB, nullable=True)
