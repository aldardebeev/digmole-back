import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASSWORD: z.string(),
  MNEMONIC: z.string(),
  AVAILABLE_BOT_WINNER_COEFFICIENT:  z.any(),
});


export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(process.env);
