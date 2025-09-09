declare namespace _exports {
    export { PoolConfig, PoolInstance, OraclePoolApi };
}
declare function _exports(oracledb: any): OraclePoolApi;
export = _exports;
type PoolConfig = {
    user: string;
    password: string;
    connectString: string;
    poolMin?: number | undefined;
    poolMax?: number | undefined;
    poolIncrement?: number | undefined;
};
type PoolInstance = {
    query: (arg0: string, arg1: any, arg2: any) => Promise<any>;
    queryStream: (...args: any[]) => import("stream").Readable;
    _pool: any;
    _config: PoolConfig;
};
type OraclePoolApi = {
    createPool: (arg0: PoolConfig) => Promise<PoolInstance>;
    createPools: (arg0: any) => Promise<{
        oradb: any;
        onDestroy: () => void;
    }>;
};
//# sourceMappingURL=orapool.d.ts.map