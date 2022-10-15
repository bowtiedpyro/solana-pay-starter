import {
    WalletAdapterNetwork
} from "@solana/wallet-adapter-base";
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import products from "./products.json";

const sellerAddress = 'EqMt31QZp6KQCt3QdnbZhkwXUSwUxD4EvJKGydrUEHL8';
const sellerPublicKey = new PublicKey(sellerAddress);

const createTransaction = async (req, res) => {
    try {
			// get data from body
			const {
				buyer,
				orderID,
				itemID
			} = req.body;

			if (!buyer) {
				return res.status(400).json({
					message: 'No buyer address found',
				});
			}

			if (!order) {
				return res.status(400).json({
					message: 'No order ID found'
				});
			}

			const itemPrice = products.find((item) => item.id == itemID).price;

			if (!itemPrice) {
				return res.status(404).json({
					message: 'Item not found. Please check item ID',
				});
			}

			const bigAmount = BigNumber(itemPrice);
			const buyerPublicKey = new PublicKey(buyer);
			const network = WalletAdapterNetwork.Mainnet;
			const endpoint = clusterApiUrl(network);
			const connection = new Connection(endpoint);

			// blockhash is an id for a block - let's you identify it
			const { blockHash } = await connection.getLatestBlockhash('finalized');
			// we need two things - recent block ID and the public key of the fee payer
			const tx = new Transaction({
				recentBlockhash: blockHash,
				feePayer: buyerPublicKey,
			});

			// the action that the transaction will take - we will just transfer some sol
			const transferInstruction = SystemProgram.transfer({
				fromPubkey: buyerPublicKey,
				lamports: bigAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber(),
				toPubKey: sellerPublicKey,
			});
			// adding more instructions to the transaction
			transferInstruction.keys.push({
				// set order id so we can find it later
				pubkey: new PublicKey(orderID),
				isSigner: false,
				isWritable: false,
			});

			tx.add(transferInstruction);

			// formatting our transaction
			const serializedTransaction = tx.serialize({
				requireAllSignatures: false,
			});

			const base64 = serializedTransaction.toString('base64');

			res.status(200).json({
				transaction: base64,
			});

    } catch (error) {
			console.error(error);
			res.status(500).json({ error: 'error creating tx' });
			return;
    }
}

export default function handler(req, res) {
	if (req.method == 'POST') {
		createTransaction(req, res);
	} else {
		res.status(405).end();
	}
}
