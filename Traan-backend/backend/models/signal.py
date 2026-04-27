from sqlalchemy import Column, Text, VARCHAR, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text, TIMESTAMP
from backend.models import Base


class Signal(Base):
    __tablename__ = "signals"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id"))
    signal_type = Column(VARCHAR(10))
    raw_content = Column(Text)
    extracted = Column(JSONB)
    source_phone = Column(VARCHAR(15))
    confidence = Column(Float)
    received_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
