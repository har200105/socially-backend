import mongoose from 'mongoose';
import { config } from './config';
import Logger from 'bunyan';


const log: Logger = config.createLogger('server');

export default () => {
  const connect = () => {
    mongoose
    .connect(`${config.DATABASE_URL}`)
      .then(() => {
      })
      .catch((error) => {
        log.error(`Error occurred while connecting to database : ${error}`)
        process.exit(1);
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};