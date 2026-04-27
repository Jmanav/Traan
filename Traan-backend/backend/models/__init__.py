from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from .ngo import NGO
from .incident import Incident
from .signal import Signal
from .volunteer import Volunteer
from .dispatch import Dispatch
from .event import Event

__all__ = ["Base", "NGO", "Incident", "Signal", "Volunteer", "Dispatch", "Event"]
