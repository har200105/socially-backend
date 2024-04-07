import mongoose from 'mongoose';


export default () => {
  const connect = () => {
    mongoose
      .connect(`${'DATABASE_URL'}`)
      .then(() => {
      })
      .catch((error) => {
        process.exit(1);
      });
  };
  connect();

  mongoose.connection.on('disconnected', connect);
};