#!/usr/bin/env node
/**
 * G*Power Matched Pairs t-Test MCP Server
 * Clean-Room Implementation
 * 
 * Exposes power analysis and clinical blood pressure tools via Model Context Protocol (MCP)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateAPriori,
  calculatePostHoc,
  calculateSensitivity,
  calculateEffectSizeFromBloodPressure,
  analyzeBloodPressureStudy
} from './engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize MCP Server
const server = new McpServer({
  name: "gpower-paired-t-server",
  version: "1.0.0"
});

// Tool 1: A Priori Power Analysis (Sample Size Computation)
server.tool(
  "calculate_apriori_sample_size",
  "Compute required sample size (N pairs) for matched pairs t-test given alpha, target power, effect size dz, and tails. Identical to G*Power.",
  {
    effectSize: z.number().positive().describe("Cohen's dz standardized effect size (mean difference / SD of differences)"),
    alpha: z.number().min(0.0001).max(0.5).default(0.05).describe("Type I error rate (significance level alpha, default: 0.05)"),
    power: z.number().min(0.1).max(0.9999).default(0.80).describe("Target statistical power (1 - beta, default: 0.80)"),
    tails: z.union([z.literal(1), z.literal(2)]).default(2).describe("1 for one-tailed, 2 for two-tailed (default: 2)")
  },
  async ({ effectSize, alpha, power, tails }) => {
    try {
      const result = calculateAPriori({ effectSize, alpha, power, tails });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }]
      };
    }
  }
);

// Tool 2: Post Hoc Power Analysis (Achieved Power Computation)
server.tool(
  "calculate_posthoc_power",
  "Compute achieved statistical power (1 - beta) for an existing sample of N matched pairs given effect size dz, sample size N, alpha, and tails.",
  {
    n: z.number().int().min(2).describe("Sample size N (number of matched pairs)"),
    effectSize: z.number().positive().describe("Cohen's dz standardized effect size"),
    alpha: z.number().min(0.0001).max(0.5).default(0.05).describe("Significance level alpha (default: 0.05)"),
    tails: z.union([z.literal(1), z.literal(2)]).default(2).describe("1 for one-tailed, 2 for two-tailed (default: 2)")
  },
  async ({ n, effectSize, alpha, tails }) => {
    try {
      const result = calculatePostHoc({ n, effectSize, alpha, tails });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }]
      };
    }
  }
);

// Tool 3: Sensitivity Power Analysis (Minimum Detectable Effect Size)
server.tool(
  "calculate_sensitivity",
  "Compute minimum detectable effect size dz given sample size N, target power, alpha, and tails.",
  {
    n: z.number().int().min(2).describe("Sample size N (number of matched pairs)"),
    power: z.number().min(0.1).max(0.9999).default(0.80).describe("Target statistical power (1 - beta, default: 0.80)"),
    alpha: z.number().min(0.0001).max(0.5).default(0.05).describe("Significance level alpha (default: 0.05)"),
    tails: z.union([z.literal(1), z.literal(2)]).default(2).describe("1 for one-tailed, 2 for two-tailed (default: 2)")
  },
  async ({ n, power, alpha, tails }) => {
    try {
      const result = calculateSensitivity({ n, power, alpha, tails });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }]
      };
    }
  }
);

// Tool 4: Blood Pressure Effect Size Drawer Calculator
server.tool(
  "calculate_blood_pressure_effect_size",
  "Calculate Cohen's dz effect size and difference SD from pre- and post-intervention blood pressure means, SDs, and correlation. Replicates G*Power Determine Drawer.",
  {
    preMean: z.number().describe("Baseline blood pressure mean in mmHg (e.g., 155)"),
    preSd: z.number().positive().describe("Baseline standard deviation in mmHg (e.g., 14)"),
    postMean: z.number().describe("Post-intervention blood pressure mean in mmHg (e.g., 142)"),
    postSd: z.number().positive().describe("Post-intervention standard deviation in mmHg (e.g., 13)"),
    rho: z.number().min(-0.999).max(0.999).describe("Pearson correlation between pre and post measurements (e.g., 0.60)")
  },
  async ({ preMean, preSd, postMean, postSd, rho }) => {
    try {
      const result = calculateEffectSizeFromBloodPressure(preMean, preSd, postMean, postSd, rho);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }]
      };
    }
  }
);

// Tool 5: Comprehensive Clinical Blood Pressure Study Protocol
server.tool(
  "analyze_blood_pressure_study",
  "Comprehensive end-to-end power calculation and study protocol recommendation for clinical blood pressure (anti-hypertensive) trials.",
  {
    preMean: z.number().describe("Baseline blood pressure mean (mmHg)"),
    preSd: z.number().positive().describe("Baseline blood pressure SD (mmHg)"),
    postMean: z.number().describe("Post-intervention blood pressure mean (mmHg)"),
    postSd: z.number().positive().describe("Post-intervention blood pressure SD (mmHg)"),
    rho: z.number().min(-0.999).max(0.999).describe("Correlation between baseline and follow-up"),
    alpha: z.number().min(0.0001).max(0.5).default(0.05).describe("Significance level alpha (default: 0.05)"),
    power: z.number().min(0.1).max(0.9999).default(0.80).describe("Target power 1 - beta (default: 0.80)"),
    tails: z.union([z.literal(1), z.literal(2)]).default(2).describe("1 for one-tailed, 2 for two-tailed (default: 2)")
  },
  async ({ preMean, preSd, postMean, postSd, rho, alpha, power, tails }) => {
    try {
      const result = analyzeBloodPressureStudy({
        preMean,
        preSd,
        postMean,
        postSd,
        rho,
        alpha,
        power,
        tails
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }]
      };
    }
  }
);

// MCP Resource: SPEC.md
server.resource(
  "gpower-paired-t-spec",
  "gpower://paired-t/spec",
  async (uri) => {
    const specPath = path.resolve(__dirname, '../SPEC.md');
    const content = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf-8') : "SPEC.md not found";
    return {
      contents: [
        {
          uri: uri.href,
          text: content,
          mimeType: "text/markdown"
        }
      ]
    };
  }
);

// Start Stdio Transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("G*Power Paired t-Test MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error in MCP server:", err);
  process.exit(1);
});
