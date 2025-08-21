declare namespace _exports {
    export { oradb, PoolConfig, PoolInstance, OraclePoolModuleOptions, OraclePoolModuleExport };
}
declare function _exports(options: OraclePoolModuleOptions, imports: any, register: (arg0: Error | null, arg1: OraclePoolModuleExport | null) => void): void;
declare namespace _exports {
    let provides: string[];
}
export = _exports;
type oradb = any;
type PoolConfig = import("./orapool").PoolConfig;
type PoolInstance = import("./orapool").PoolInstance;
type OraclePoolModuleOptions = {
    /**
     * Liste des pools à créer
     */
    databases?: {
        [x: string]: {
            url: PoolConfig;
        };
    } | undefined;
    /**
     * Pool principal
     */
    url?: {
        url: PoolConfig;
    } | undefined;
};
type OraclePoolModuleExport = {
    oradb: {
        [x: string]: orapool.PoolInstance;
    };
    onDestroy: () => void;
};
import orapool = require("./orapool");
//# sourceMappingURL=index.d.ts.map