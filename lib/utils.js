var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { address, payments, Psbt, Transaction } from "bitcoinclassicjs-lib";
import BN from "bn.js";
import { AddressType } from "./OrdTransaction.js";
export function satoshisToAmount(val) {
    const num = new BN(val);
    return num.div(new BN(100000000)).toString(10);
}
export function amountToSaothis(val) {
    const num = new BN(val);
    return num.mul(new BN(100000000)).toNumber();
}
export const calculateFee = (psbt, feeRate, address, signPsbtHex) => __awaiter(void 0, void 0, void 0, function* () {
    psbt.addOutput({ address, value: 0 });
    psbt = Psbt.fromHex(yield signPsbtHex(psbt.toHex()));
    psbt.finalizeAllInputs();
    const txSize = psbt.extractTransaction(true).toBuffer().length;
    const fee = Math.ceil(txSize * feeRate);
    return fee;
});
export const addPsbtInput = ({ network, psbt, publicKey, utxo, sighashType, }) => {
    if (utxo.rawHex) {
    }
    const tx = Transaction.fromHex(utxo.rawHex);
    const outpoint = tx.outs[utxo.outputIndex];
    const addressStr = address.fromOutputScript(outpoint.script);
    const addressType = getAddressType(addressStr, network);
    let input = {
        hash: utxo.txId,
        index: utxo.outputIndex,
        nonWitnessUtxo: Buffer.from(utxo.rawHex, "hex"),
    };
    const witnessUtxo = getWintessUtxo(Object.assign(Object.assign({}, utxo), { satoshis: outpoint.value }), addressType, publicKey, network);
    if (typeof witnessUtxo !== "undefined") {
        input.witnessUtxo = witnessUtxo;
    }
    if (typeof sighashType !== "undefined") {
        input.sighashType = sighashType;
    }
    psbt.addInput(input);
};
export function getAddressType(addressStr, network) {
    try {
        const version = address.fromBase58Check(addressStr).version;
        if (version === network.pubKeyHash)
            return 0;
        if (version === network.scriptHash)
            return undefined;
    }
    catch (_a) {
        try {
            const version = address.fromBech32(addressStr).version;
            if (version === 0x00)
                return 1;
            if (version === 0x01)
                return 2;
        }
        catch (_b) { }
    }
    return undefined;
}
export const getWintessUtxo = (utxo, addressType, publicKeyStr, network) => {
    const pubkey = Buffer.from(publicKeyStr, "hex");
    switch (addressType) {
        case AddressType.P2TR:
            return {
                script: payments.p2tr({
                    internalPubkey: toXOnly(pubkey),
                    network,
                }).output,
                value: utxo.satoshis,
            };
        case AddressType.P2WPKH:
            return {
                script: payments.p2wpkh({
                    pubkey,
                    network,
                }).output,
                value: utxo.satoshis,
            };
        default:
            return undefined;
    }
};
const toXOnly = (pubKey) => pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
//# sourceMappingURL=utils.js.map