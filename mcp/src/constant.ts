import axios from 'axios';
import PackageJSON from '../package.json';
import { env } from './env.js';

export const USER_AGENT = `healthlist/v${PackageJSON.version}`;
export const api = axios.create({
    baseURL: env.HEALTHLIST_API_URL,
    headers: {
        'User-Agent': USER_AGENT,
        'mcp-token': env.MCP_SERVER_TOKEN
    }
});
