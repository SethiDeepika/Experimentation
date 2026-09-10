import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed at https://sethideepika.github.io/experimentation/meeting-prep-generator/
// (this app lives in a subfolder of the `experimentation` repo, alongside another
// portfolio project at the repo root). If you ever move this app to its own repo
// named "meeting-prep-generator", change base to '/meeting-prep-generator/'.
export default defineConfig({
  base: "/experimentation/meeting-prep-generator/",
  plugins: [react()],
});
