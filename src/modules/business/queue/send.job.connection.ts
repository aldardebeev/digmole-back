import { Queue } from "bullmq";
import { config } from "src/configs/config";

const redisOptions = {
  port: config.REDIS_PORT,
  host: config.REDIS_HOST,
  password: config.REDIS_PASSWORD,
  db: 2,
};

const queueGame = (queueTitle: string) => {
  return new Queue(queueTitle, {
    connection: redisOptions
  });
}

export default queueGame;
