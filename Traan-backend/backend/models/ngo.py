from sqlalchemy import Column, Text, VARCHAR
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text
from backend.models import Base


class NGO(Base):
    __tablename__ = "ngos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(Text)
    region = Column(Text)
    api_key = Column(VARCHAR(64), unique=True)
