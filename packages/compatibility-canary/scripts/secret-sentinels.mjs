export const CANARY_SECRET_SENTINELS = Object.freeze([
  "dds_sentinel_7VYk9qL2mN4pR8tW6xZ1cF3h",
]);

export function withSecretSentinels(environment) {
  return {
    ...environment,
    DDS_CANARY_SECRET_SENTINEL: CANARY_SECRET_SENTINELS[0],
  };
}
