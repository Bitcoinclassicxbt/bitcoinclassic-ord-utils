import { Network, Psbt } from "bitcoinclassicjs-lib";
import { AddressType, UnspentOutputBase } from "./OrdTransaction.js";
import { AddInputProps } from "./types.js";
export declare function satoshisToAmount(val: number): string;
export declare function amountToSaothis(val: any): number;
export declare const calculateFee: (psbt: Psbt, feeRate: number, address: string, signPsbtHex: (psbtHex: string) => Promise<string>) => Promise<number>;
export declare const addPsbtInput: ({ network, psbt, publicKey, utxo, sighashType, }: AddInputProps) => void;
export declare function getAddressType(addressStr: string, network: Network): AddressType.P2WPKH | AddressType.P2PKH | AddressType.P2TR | undefined;
export declare const getWintessUtxo: (utxo: UnspentOutputBase, addressType: number | undefined, publicKeyStr: string, network: Network) => {
    script: Buffer;
    value: number;
};
