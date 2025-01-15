import { UnspentOutput } from "./OrdTransaction.js";
import { OrdUnit } from "./OrdUnit.js";
export declare const UTXO_DUST = 1000;
export declare class OrdUnspendOutput {
    ordUnits: OrdUnit[];
    utxo: UnspentOutput;
    constructor(utxo: UnspentOutput, outputValue?: number);
    private split;
    /**
     * Get non-Ord satoshis for spending
     */
    getNonOrdSatoshis(): number;
    /**
     * Get last non-ord satoshis for spending.
     * Only the last one is available
     * @returns
     */
    getLastUnitSatoshis(): number;
    hasOrd(): boolean;
    dump(): void;
}
