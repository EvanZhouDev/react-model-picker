import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["index.tsx"], // Corrected path to the root index.tsx
	format: ["cjs", "esm"], // Output format(s)
	dts: true, // Generate declaration files (.d.ts)
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["react", "react-dom"],
});
