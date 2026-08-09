-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNDER_ATTACK', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'MITIGATED', 'RESOLVED', 'INVESTIGATING');

-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('NORMAL', 'ANOMALOUS', 'ATTACK');

-- CreateEnum
CREATE TYPE "AttackType" AS ENUM ('VOLUMETRIC', 'PROTOCOL', 'APPLICATION_LAYER', 'CREDENTIAL_STUFFING', 'REPLAY_ATTACK', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SystemEventType" AS ENUM ('SERVER_START', 'SERVER_STOP', 'DB_CONNECTED', 'DB_DISCONNECTED', 'ML_MODEL_LOADED', 'ML_MODEL_UNLOADED', 'CONFIG_CHANGE', 'SECURITY_POLICY_UPDATE', 'MANUAL_OVERRIDE');

-- CreateTable
CREATE TABLE "charging_stations" (
    "id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'ONLINE',
    "ip_address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charging_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attack_incidents" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "station_id" TEXT,
    "attack_type" "AttackType" NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "requests_per_sec" DOUBLE PRECISION,
    "source_ips" TEXT[],
    "packets_dropped" INTEGER DEFAULT 0,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attack_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "station_id" TEXT,
    "incident_id" TEXT,
    "severity" "SeverityLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_predictions" (
    "id" TEXT NOT NULL,
    "prediction_id" TEXT NOT NULL,
    "station_id" TEXT,
    "incident_id" TEXT,
    "classification" "ClassificationType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model_version" TEXT,
    "feature_summary" JSONB,
    "raw_feature_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "event_type" "SystemEventType" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charging_stations_station_id_key" ON "charging_stations"("station_id");

-- CreateIndex
CREATE UNIQUE INDEX "attack_incidents_incident_id_key" ON "attack_incidents"("incident_id");

-- CreateIndex
CREATE INDEX "attack_incidents_station_id_idx" ON "attack_incidents"("station_id");

-- CreateIndex
CREATE INDEX "attack_incidents_severity_idx" ON "attack_incidents"("severity");

-- CreateIndex
CREATE INDEX "attack_incidents_status_idx" ON "attack_incidents"("status");

-- CreateIndex
CREATE INDEX "attack_incidents_start_time_idx" ON "attack_incidents"("start_time");

-- CreateIndex
CREATE UNIQUE INDEX "security_alerts_alert_id_key" ON "security_alerts"("alert_id");

-- CreateIndex
CREATE INDEX "security_alerts_station_id_idx" ON "security_alerts"("station_id");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_acknowledged_idx" ON "security_alerts"("acknowledged");

-- CreateIndex
CREATE UNIQUE INDEX "ml_predictions_prediction_id_key" ON "ml_predictions"("prediction_id");

-- CreateIndex
CREATE INDEX "ml_predictions_station_id_idx" ON "ml_predictions"("station_id");

-- CreateIndex
CREATE INDEX "ml_predictions_classification_idx" ON "ml_predictions"("classification");

-- CreateIndex
CREATE INDEX "ml_predictions_created_at_idx" ON "ml_predictions"("created_at");

-- CreateIndex
CREATE INDEX "system_events_event_type_idx" ON "system_events"("event_type");

-- CreateIndex
CREATE INDEX "system_events_created_at_idx" ON "system_events"("created_at");

-- AddForeignKey
ALTER TABLE "attack_incidents" ADD CONSTRAINT "attack_incidents_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "charging_stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "charging_stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "attack_incidents"("incident_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_predictions" ADD CONSTRAINT "ml_predictions_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "charging_stations"("station_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_predictions" ADD CONSTRAINT "ml_predictions_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "attack_incidents"("incident_id") ON DELETE SET NULL ON UPDATE CASCADE;
