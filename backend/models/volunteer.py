from sqlalchemy import Column, Text, VARCHAR, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy import text, TIMESTAMP
from geoalchemy2 import Geometry
from backend.models import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(Text)
    phone = Column(VARCHAR(15), unique=True)
    skills = Column(ARRAY(Text))
    language_capabilities = Column(ARRAY(Text))
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    is_available = Column(Boolean, server_default="false")
    last_seen = Column(TIMESTAMP(timezone=True), nullable=True)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("ngos.id"), nullable=True)
