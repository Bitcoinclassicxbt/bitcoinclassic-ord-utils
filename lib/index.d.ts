import type { CreateSendOrd, CreateSendXBT, CreateMultiSendOrd } from "./types.js";
import { Psbt } from "bitcoinclassicjs-lib";
export declare function createSendXBT({ utxos, toAddress, toAmount, signTransaction, network, changeAddress, receiverToPayFee, feeRate, pubkey, calculateFee, enableRBF, }: CreateSendXBT): Promise<Psbt>;
export declare function createSendOrd({ utxos, toAddress, network, changeAddress, pubkey, feeRate, outputValue, signTransaction, calculateFee, enableRBF, }: CreateSendOrd): Promise<Psbt>;
export declare function createMultisendOrd({ utxos, toAddress, signPsbtHex, network, changeAddress, publicKey, feeRate, }: CreateMultiSendOrd): Promise<string>;
