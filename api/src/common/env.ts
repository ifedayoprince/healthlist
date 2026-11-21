import { envsafe, str } from "envsafe";

const env = envsafe({
    DATABASE_URL: str()
});

export default env;
