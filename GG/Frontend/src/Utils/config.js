import { getApiBase } from "./apiBase";

export default {
    api: {
        get API_BASE_URL() {
            const b = getApiBase();
            return b ? `${b.replace(/\/$/, "")}/` : "/";
        },
        ROUTER_BASE_NAME: null,
    },
    app: {
        /**
         * The base URL for all locations. If your app is served from a sub-directory on your server, you'll want to set
         * this to the sub-directory. A properly formatted basename should have a leading slash, but no trailing slash.
         */
        ROUTER_BASE_NAME: null,
    }
};