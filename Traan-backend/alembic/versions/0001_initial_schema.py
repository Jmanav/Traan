"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "ngos",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.Text()),
        sa.Column("region", sa.Text()),
        sa.Column("api_key", sa.VARCHAR(64), unique=True),
    )

    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("location_raw", sa.Text()),
        sa.Column("coordinates",
                  geoalchemy2.types.Geometry("POINT", srid=4326), nullable=True),
        sa.Column("severity_score", sa.Integer()),
        sa.Column("tier", sa.VARCHAR(20)),
        sa.Column("need_types", postgresql.ARRAY(sa.Text())),
        sa.Column("vulnerable_groups", postgresql.ARRAY(sa.Text())),
        sa.Column("affected_count", sa.Integer()),
        sa.Column("access_constraints", sa.Text()),
        sa.Column("status", sa.VARCHAR(20), server_default="active"),
        sa.Column("signal_count", sa.Integer(), server_default="1"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("NOW()")),
    )

    op.create_table(
        "volunteers",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.Text()),
        sa.Column("phone", sa.VARCHAR(15), unique=True),
        sa.Column("skills", postgresql.ARRAY(sa.Text())),
        sa.Column("language_capabilities", postgresql.ARRAY(sa.Text())),
        sa.Column("location",
                  geoalchemy2.types.Geometry("POINT", srid=4326), nullable=True),
        sa.Column("is_available", sa.Boolean(), server_default="false"),
        sa.Column("last_seen", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("ngo_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("ngos.id"), nullable=True),
    )

    op.create_table(
        "signals",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("incidents.id")),
        sa.Column("signal_type", sa.VARCHAR(10)),
        sa.Column("raw_content", sa.Text()),
        sa.Column("extracted", postgresql.JSONB()),
        sa.Column("source_phone", sa.VARCHAR(15)),
        sa.Column("confidence", sa.Float()),
        sa.Column("received_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("NOW()")),
    )

    op.create_table(
        "dispatches",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("incidents.id")),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("volunteers.id")),
        sa.Column("status", sa.VARCHAR(20), server_default="sent"),
        sa.Column("dispatched_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("NOW()")),
        sa.Column("confirmed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("arrived_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("approach_route", postgresql.JSONB(), nullable=True),
    )

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True),
                  server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("incident_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("incidents.id")),
        sa.Column("agent_name", sa.VARCHAR(30)),
        sa.Column("action", sa.Text()),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("logged_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("NOW()")),
    )

    op.execute("CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON incidents USING gist (coordinates)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteers USING gist (location)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_signals_incident ON signals (incident_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dispatches_incident ON dispatches (incident_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_incident ON events (incident_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_events_incident")
    op.execute("DROP INDEX IF EXISTS idx_dispatches_incident")
    op.execute("DROP INDEX IF EXISTS idx_signals_incident")
    op.execute("DROP INDEX IF EXISTS idx_volunteers_location")
    op.execute("DROP INDEX IF EXISTS idx_incidents_coordinates")
    op.drop_table("events")
    op.drop_table("dispatches")
    op.drop_table("signals")
    op.drop_table("volunteers")
    op.drop_table("incidents")
    op.drop_table("ngos")
    op.execute("DROP EXTENSION IF EXISTS postgis")