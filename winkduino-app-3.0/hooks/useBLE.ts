import { useContext } from "react";
import { BleContext } from "../Components/BleProvider";
export function useBLE() {
  const ctx = useContext(BleContext);
  if (!ctx) {
    throw new Error("useBLE must be inside BleProvider");
  }
  return ctx;
}