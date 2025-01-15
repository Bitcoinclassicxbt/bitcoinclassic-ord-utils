var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { OrdTransaction, } from "./OrdTransaction.js";
import { UTXO_DUST } from "./OrdUnspendOutput.js";
import { addPsbtInput, calculateFee, satoshisToAmount } from "./utils.js";
import { networks, Psbt } from "bitcoinclassicjs-lib";
export function createSendXBT(_a) {
    return __awaiter(this, arguments, void 0, function* ({ utxos, toAddress, toAmount, signTransaction, network, changeAddress, receiverToPayFee, feeRate, pubkey, calculateFee, enableRBF = true, }) {
        const tx = new OrdTransaction({
            signTransaction,
            network,
            pubkey,
            feeRate,
            calculateFee,
        });
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        tx.addOutput(toAddress, toAmount);
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        if (nonOrdUtxos.length === 0) {
            throw new Error("Balance not enough");
        }
        if (receiverToPayFee) {
            const unspent = tx.getUnspent();
            if (unspent >= UTXO_DUST) {
                tx.addChangeOutput(unspent);
            }
            const networkFee = yield tx.calNetworkFee();
            const output = tx.outputs.find((v) => v.address === toAddress);
            if (output.value < networkFee) {
                throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} XBT as network fee`);
            }
            output.value -= networkFee;
        }
        else {
            const unspent = tx.getUnspent();
            if (unspent <= 0) {
                throw new Error("Balance not enough to pay network fee.");
            }
            // add dummy output
            tx.addChangeOutput(1);
            const networkFee = yield tx.calNetworkFee();
            if (unspent < networkFee) {
                throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} XBT as network fee, but only ${satoshisToAmount(unspent)} XBT.`);
            }
            const leftAmount = unspent - networkFee;
            if (leftAmount >= UTXO_DUST) {
                // change dummy output to true output
                tx.getChangeOutput().value = leftAmount;
            }
            else {
                // remove dummy output
                tx.removeChangeOutput();
            }
        }
        const psbt = yield tx.createSignedPsbt();
        return psbt;
    });
}
export function createSendOrd(_a) {
    return __awaiter(this, arguments, void 0, function* ({ utxos, toAddress, network, changeAddress, pubkey, feeRate, outputValue, signTransaction, calculateFee, enableRBF = true, }) {
        const tx = new OrdTransaction({
            network,
            pubkey,
            signTransaction,
            calculateFee,
            feeRate,
        });
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        // find NFT
        let found = false;
        for (let i = 0; i < ordUtxos.length; i++) {
            const ordUtxo = ordUtxos[i];
            if (ordUtxo.ords.length > 1) {
                throw new Error("Multiple inscriptions! Please split them first.");
            }
            tx.addInput(ordUtxo);
            tx.addOutput(toAddress, ordUtxo.satoshis);
            found = true;
        }
        if (!found) {
            throw new Error("inscription not found.");
        }
        // format NFT
        tx.outputs[0].value = outputValue;
        // select non ord utxo
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        const unspent = tx.getUnspent();
        if (unspent <= 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        // add dummy output
        tx.addChangeOutput(1);
        const networkFee = yield tx.calNetworkFee();
        if (unspent < networkFee) {
            throw new Error(`Balance not enough. Need ${satoshisToAmount(networkFee)} XBT as network fee, but only ${satoshisToAmount(unspent)} XBT`);
        }
        const leftAmount = unspent - networkFee;
        if (leftAmount >= UTXO_DUST) {
            // change dummy output to true output
            tx.getChangeOutput().value = leftAmount;
        }
        else {
            // remove dummy output
            tx.removeChangeOutput();
        }
        const psbt = yield tx.createSignedPsbt();
        return psbt;
    });
}
export function createMultisendOrd(_a) {
    return __awaiter(this, arguments, void 0, function* ({ utxos, toAddress, signPsbtHex, network = networks.bitcoinclassic, changeAddress, publicKey, feeRate, }) {
        let tx = new Psbt({ network });
        tx.setVersion(1);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        for (let i = 0; i < ordUtxos.length; i++) {
            const ordUtxo = ordUtxos[i];
            if (ordUtxo.ords.length > 1) {
                throw new Error("Multiple inscriptions! Please split them first.");
            }
            addPsbtInput({ network, psbt: tx, publicKey, utxo: ordUtxo });
            tx.addOutput({ address: toAddress, value: ordUtxo.satoshis });
        }
        let amount = 0;
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            amount += nonOrdUtxo.satoshis;
            addPsbtInput({ network, psbt: tx, publicKey, utxo: nonOrdUtxo });
        }
        const fee = yield calculateFee(tx.clone(), feeRate, changeAddress, signPsbtHex);
        const change = amount - fee;
        if (change < 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        tx.addOutput({ address: changeAddress, value: change });
        tx = Psbt.fromHex(yield signPsbtHex(tx.toHex()));
        tx.finalizeAllInputs();
        return tx.extractTransaction(true).toHex();
    });
}
//# sourceMappingURL=index.js.map