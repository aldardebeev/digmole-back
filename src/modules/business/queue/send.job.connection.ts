import { Queue } from "bullmq";

const redisOptions = {
  port: 6223,
  host: 'localhost',
  password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
  db: 2,
};

const queueGame = (queueTitle: string) => {
  return new Queue(queueTitle, {
    connection: redisOptions
  });
}

export default queueGame;
