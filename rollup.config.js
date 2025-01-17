import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "rollup-plugin-replace";
import dotenv from "dotenv";

dotenv.config();

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
  {
    input: "background/service_worker.js",
    output: {
      file: "dist/background.bundle.js",
      format: "iife",
    },
    plugins: [
      replace({
        "process.env.API_ENDPOINT": JSON.stringify(process.env.API_ENDPOINT),
        "process.env.API_KEY": JSON.stringify(process.env.API_KEY),
      }),
    ],
  },
];
