import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import express, { Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/routes';
import { requestId } from './middlewares/request_id';
import { AuthenticatedRequest } from './types';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const apiURL = '/api/v1';

const app: Express = express();

app.set('trust proxy', process.env.TRUST_PROXY || '0');

app.use(requestId);

app.use(helmet());

const limiter = rateLimit({
  max: 200,
  windowMs: 15 * 60 * 100,
  message: 'Rate limit exceeded. Please try again in a few minutes.',
  legacyHeaders: false,
});

app.use(apiURL, limiter);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(morgan('dev'));

app.use(apiURL, router);

app.use(notFound);
app.use(errorHandler);

export default app;
