import { nodeResolve } from "@rollup/plugin-node-resolve";

export default [
  {
    input: "content/index.js",
    output: {
      file: "dist/content.bundle.js",
      format: "iife",
    },
    plugins: [
      nodeResolve(),
    ],
  },
  {
    input: "sidepanel/index.js",
    output: {
      file: "dist/sidepanel.bundle.js",
      format: "iife",
    },
    plugins: [
      nodeResolve(),
    ],
  },
];
