from sqlalchemy import Column, Text, VARCHAR, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import text, TIMESTAMP
from geoalchemy2 import Geometry
from backend.models import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    location_raw = Column(Text)
    coordinates = Column(Geometry("POINT", srid=4326), nullable=True)
    severity_score = Column(Integer)
    tier = Column(VARCHAR(20))
    need_types = Column(ARRAY(Text))
    vulnerable_groups = Column(ARRAY(Text))
    affected_count = Column(Integer)
    access_constraints = Column(Text)
    status = Column(VARCHAR(20), server_default="active")
    signal_count = Column(Integer, server_default="1")
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
