import axios from 'axios';
import { BVG_BASE_URL } from '../constants/config';

const bvgClient = axios.create({
  baseURL: BVG_BASE_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

bvgClient.interceptors.response.use(
  res => res,
  err => {
    console.error('[BVG API Error]', err.message);
    return Promise.reject(err);
  }
);

export default bvgClient;