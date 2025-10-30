import scenariosData from "../../../data/qr_scenarios.json";
import type { QRAction } from "./qr";

export interface QrScenario {
  id: string;
  label: string;
  payload: string;
  expectedAction: QRAction;
  notes?: string;
}

const SCENARIOS: QrScenario[] = scenariosData as QrScenario[];

export function getAllQrScenarios(): QrScenario[] {
  return SCENARIOS;
}

export function findScenarioByPayload(payload: string): QrScenario | undefined {
  return SCENARIOS.find((scenario) => scenario.payload === payload);
}

export function findScenarioById(id: string): QrScenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
