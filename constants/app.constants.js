const API_RESPONSE_CODE = {
    400: "Bad request",
    200: "Success",
    404: "Not found",
    409: "Entered details already exists",
    500: "Internal server error",
    403: "Forbidden",
    507: "Insufficient Storage",
};

const XRPL_ACCOUNT_FLAGS_DECIMAL_VALUES = {
    DEFAULT_RIPPLE: 8388608,
    DEPOSIT_AUTH: 16777216,
    DISABLE_MASTER_KEY: 1048576,
    DISALLOW_XRP: 524288,
    GLOBAL_FREEZE: 4194304,
    NO_FREEZE: 2097152,
    PASSWORD_SPENT: 65536,
    REQUIRE_AUTH: 262144,
    REQUIRE_DESTINATION_TAG: 131072
}

module.exports = {
    API_RESPONSE_CODE,
    XRPL_ACCOUNT_FLAGS_DECIMAL_VALUES,
};
