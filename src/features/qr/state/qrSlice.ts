import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { QRAction } from "../services/qr";

type ScanStatus = "idle" | "scanning" | "succeeded" | "failed";

export interface QrScanRecord {
  raw: string;
  action: QRAction;
  scannedAt: string;
}

export interface QrState {
  lastScan?: QrScanRecord;
  status: ScanStatus;
  error?: string;
  cameraEnabled: boolean;
}

const initialState: QrState = {
  status: "idle",
  cameraEnabled: true,
};

const qrSlice = createSlice({
  name: "qr",
  initialState,
  reducers: {
    scanStarted(state) {
      state.status = "scanning";
      state.error = undefined;
    },
    scanSucceeded(state, action: PayloadAction<QrScanRecord>) {
      state.status = "succeeded";
      state.lastScan = action.payload;
      state.error = undefined;
    },
    scanFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    clearLastScan(state) {
      state.lastScan = undefined;
      state.status = "idle";
      state.error = undefined;
    },
    setCameraEnabled(state, action: PayloadAction<boolean>) {
      state.cameraEnabled = action.payload;
    },
  },
});

export const {
  scanStarted,
  scanSucceeded,
  scanFailed,
  clearLastScan,
  setCameraEnabled,
} = qrSlice.actions;

export default qrSlice.reducer;
