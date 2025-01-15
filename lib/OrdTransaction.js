var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { UTXO_DUST } from "./OrdUnspendOutput.js";
import { payments, networks, Psbt } from "bitcoinclassicjs-lib";
export var AddressType;
(function (AddressType) {
    AddressType[AddressType["P2PKH"] = 0] = "P2PKH";
    AddressType[AddressType["P2WPKH"] = 1] = "P2WPKH";
    AddressType[AddressType["P2TR"] = 2] = "P2TR";
    AddressType[AddressType["P2SH_P2WPKH"] = 3] = "P2SH_P2WPKH";
    AddressType[AddressType["M44_P2WPKH"] = 4] = "M44_P2WPKH";
    AddressType[AddressType["M44_P2TR"] = 5] = "M44_P2TR";
})(AddressType || (AddressType = {}));
export const toXOnly = (pubKey) => pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
export function utxoToInput(utxo, publicKey) {
    if (utxo.addressType === AddressType.P2SH_P2WPKH) {
        const redeemData = payments.p2wpkh({ pubkey: publicKey });
        const data = Object.assign({ hash: utxo.txId, index: utxo.outputIndex }, (utxo.rawHex
            ? { nonWitnessUtxo: Buffer.from(utxo.rawHex, "hex") }
            : {
                witnessUtxo: {
                    script: Buffer.from(utxo.scriptPk, "hex"),
                    value: utxo.satoshis,
                },
            }));
        return {
            data,
            utxo,
        };
    }
    else {
        const data = Object.assign({ hash: utxo.txId, index: utxo.outputIndex }, (utxo.rawHex
            ? { nonWitnessUtxo: Buffer.from(utxo.rawHex, "hex") }
            : {
                witnessUtxo: {
                    script: Buffer.from(utxo.scriptPk, "hex"),
                    value: utxo.satoshis,
                },
            }));
        return {
            data,
            utxo,
        };
    }
}
export class OrdTransaction {
    constructor({ network, pubkey, signTransaction, calculateFee, feeRate, }) {
        this.inputs = [];
        this.outputs = [];
        this.changeOutputIndex = -1;
        this.network = networks.bitcoinclassic;
        this.enableRBF = true;
        this.signTransaction = signTransaction;
        this.calculateFee = calculateFee;
        this.network = network;
        this.pubkey = pubkey;
        this.feeRate = feeRate || 5;
    }
    setEnableRBF(enable) {
        this.enableRBF = enable;
    }
    setChangeAddress(address) {
        this.changedAddress = address;
    }
    addInput(utxo) {
        this.inputs.push(utxoToInput(utxo, Buffer.from(this.pubkey, "hex")));
    }
    getTotalInput() {
        return this.inputs.reduce((pre, cur) => pre + cur.utxo.satoshis, 0);
    }
    getTotalOutput() {
        return this.outputs.reduce((pre, cur) => pre + cur.value, 0);
    }
    getUnspent() {
        return this.getTotalInput() - this.getTotalOutput();
    }
    isEnoughFee() {
        return __awaiter(this, void 0, void 0, function* () {
            const psbt1 = yield this.createSignedPsbt();
            if (psbt1.getFeeRate() >= this.feeRate) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    calNetworkFee() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.calculateFee) {
                const psbt = yield this.createSignedPsbt(true);
                psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
                return yield this.calculateFee(psbt.toHex(), this.feeRate);
            }
            const psbt = yield this.createSignedPsbt();
            let txSize = psbt.extractTransaction(true).toBuffer().length;
            psbt.data.inputs.forEach((v) => {
                if (v.finalScriptWitness) {
                    txSize -= v.finalScriptWitness.length * 0.75;
                }
            });
            const fee = Math.ceil(txSize * this.feeRate);
            return fee;
        });
    }
    addOutput(address, value) {
        this.outputs.push({
            address,
            value,
        });
    }
    getOutput(index) {
        return this.outputs[index];
    }
    addChangeOutput(value) {
        this.outputs.push({
            address: this.changedAddress,
            value,
        });
        this.changeOutputIndex = this.outputs.length - 1;
    }
    getChangeOutput() {
        return this.outputs[this.changeOutputIndex];
    }
    getChangeAmount() {
        const output = this.getChangeOutput();
        return output ? output.value : 0;
    }
    removeChangeOutput() {
        this.outputs.splice(this.changeOutputIndex, 1);
        this.changeOutputIndex = -1;
    }
    removeRecentOutputs(count) {
        this.outputs.splice(-count);
    }
    createSignedPsbt() {
        return __awaiter(this, arguments, void 0, function* (skipSign = false) {
            const psbt = new Psbt({ network: this.network });
            psbt.setVersion(1);
            this.inputs.forEach((v, index) => {
                //@ts-ignore
                psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
                psbt.addInput(v.data);
                if (this.enableRBF) {
                    psbt.setInputSequence(index, 0xfffffffd); // support RBF
                }
            });
            this.outputs.forEach((v) => {
                psbt.addOutput(v);
            });
            if (!skipSign)
                yield this.signTransaction(psbt);
            return psbt;
        });
    }
    generate(autoAdjust) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to estimate fee
            const unspent = this.getUnspent();
            this.addChangeOutput(Math.max(unspent, 0));
            const psbt1 = yield this.createSignedPsbt();
            // this.dumpTx(psbt1);
            this.removeChangeOutput();
            // todo: support changing the feeRate
            const txSize = psbt1.extractTransaction().toBuffer().length;
            const fee = txSize * this.feeRate;
            if (unspent > fee) {
                const left = unspent - fee;
                if (left > UTXO_DUST) {
                    this.addChangeOutput(left);
                }
            }
            else {
                if (autoAdjust) {
                    this.outputs[0].value -= fee - unspent;
                }
            }
            const psbt2 = yield this.createSignedPsbt();
            const tx = psbt2.extractTransaction();
            const rawtx = tx.toHex();
            const toAmount = this.outputs[0].value;
            return {
                fee: psbt2.getFee(),
                rawtx,
                toSatoshis: toAmount,
                estimateFee: fee,
            };
        });
    }
}
//# sourceMappingURL=OrdTransaction.js.map