import { envsafe, str } from "envsafe";

export const env = envsafe({
    MCP_SERVER_TOKEN: str(),
    HEALTHLIST_API_URL: str()
});
