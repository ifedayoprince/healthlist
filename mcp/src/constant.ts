import axios from 'axios';
import PackageJSON from '../package.json';

export const USER_AGENT = `healthlist/v${PackageJSON.version}`;
export const api = axios.create({
    baseURL: process.env.API_BASE ?? "http://localhost:3000",
    headers: {
        'User-Agent': USER_AGENT
    }
});
