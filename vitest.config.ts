import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		// Several processor tests run the full pipeline on multi-megapixel
		// fixtures (up to 2816x1536). That legitimately takes ~6-7s each in a
		// single Node thread, which exceeds Vitest's 5s default and made the
		// suite fail on slower machines / CI. Give heavy tests room to finish.
		testTimeout: 30000,
		hookTimeout: 30000,
	},
});
