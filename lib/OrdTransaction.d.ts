import { Psbt } from "bitcoinclassicjs-lib";
import type { CreateSendXBT } from "./types.js";
interface TxInput {
    data: {
        hash: string;
        index: number;
        nonWitnessUtxo?: Buffer;
        witnessUtxo?: {
            script: Buffer;
            value: number;
        };
    };
    utxo: UnspentOutput;
}
interface TxOutput {
    address: string;
    value: number;
}
export interface UnspentOutputBase {
    txId: string;
    outputIndex: number;
    satoshis: number;
    ords: {
        id: string;
        offset: number;
    }[];
    rawHex?: string;
}
export interface UnspentOutput extends UnspentOutputBase {
    scriptPk: string;
    addressType: AddressType;
    address: string;
}
export declare enum AddressType {
    P2PKH = 0,
    P2WPKH = 1,
    P2TR = 2,
    P2SH_P2WPKH = 3,
    M44_P2WPKH = 4,
    M44_P2TR = 5
}
export declare const toXOnly: (pubKey: Buffer) => Buffer;
export declare function utxoToInput(utxo: UnspentOutput, publicKey: Buffer): TxInput;
export declare class OrdTransaction {
    private inputs;
    outputs: TxOutput[];
    private changeOutputIndex;
    private signTransaction;
    private calculateFee?;
    changedAddress: string;
    private network;
    private feeRate;
    private pubkey;
    private enableRBF;
    constructor({ network, pubkey, signTransaction, calculateFee, feeRate, }: Pick<CreateSendXBT, "signTransaction" | "network" | "pubkey" | "feeRate" | "calculateFee">);
    setEnableRBF(enable: boolean): void;
    setChangeAddress(address: string): void;
    addInput(utxo: UnspentOutput): void;
    getTotalInput(): number;
    getTotalOutput(): number;
    getUnspent(): number;
    isEnoughFee(): Promise<boolean>;
    calNetworkFee(): Promise<number>;
    addOutput(address: string, value: number): void;
    getOutput(index: number): TxOutput;
    addChangeOutput(value: number): void;
    getChangeOutput(): TxOutput;
    getChangeAmount(): number;
    removeChangeOutput(): void;
    removeRecentOutputs(count: number): void;
    createSignedPsbt(skipSign?: boolean): Promise<Psbt>;
    generate(autoAdjust: boolean): Promise<{
        fee: number;
        rawtx: string;
        toSatoshis: number;
        estimateFee: number;
    }>;
}
export {};
