import { envsafe, str } from "envsafe";

const env = envsafe({
    DATABASE_URL: str(),
    FRONTEND_URL: str(),

    /** 32 byte base64url string */
    MCP_SERVER_TOKEN: str(),
    /** Set to a non-empty value to enable MCP requests only from a trusted IP\ */
    MCP_SERVER_IP: str({allowEmpty: true, default: ''})
});

export default env;
