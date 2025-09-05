import { connectToDB } from './config/db';
import 'dotenv/config';
import app from './app';

connectToDB().catch((err) => console.log(err));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}...`);
});
