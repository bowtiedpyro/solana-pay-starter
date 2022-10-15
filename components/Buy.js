import React, { useState, useMemo } from "react";
import { Keypair, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { InfinitySpin } from "react-loader-spinner";
import IPFSDownload from "./IpfsDownload";

export default function Buy({ itemID }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const orderID = useMemo(() => Keypair.generate().publicKey, []); // pubkey used to identify the order

  const [paid, setPaid] = useState(null);
  const [loading, setLoading] = useState(false); // loading state of all the above processes

  const order = useMemo(
    () => ({
      buyer: publicKey.toString(),
      orderID: orderID.toString(),
      itemID: itemID,
    }),
    [publicKey, orderID, itemID]
  );

  // fetch the transaction object from the server
  const processTransaction = async () => {
    setLoading(true);
    const txResponse = await fetch('../api/createTransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    const txData = await txResponse.json();
    // creating a transaction object 
    const tx = Transaction.from(Buffer.from(txData.transaction, 'base64'));
    console.log('tx data is:', tx);

    // attempt to send the transaction to the network
    try {
      const txHash = await sendTransaction(tx, connection);
      console.log(`Transaction sent: https://solscan.io/tx/${txHash}?cluster=mainnet`);
      // set to true, for demo purpose - it could also fail.
      setPaid(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div>
        <p>In order to make transactions you need to connect your wallet.</p>
      </div>
    )
  }

  if (loading) {
    return <InfinitySpin color='goldenRod' />;
  }

  return (
    <div>
      {
        paid ? (
          <IPFSDownload filename='The legend of Pyro' hash='bafybeic3i63n7xxpjj74lqvrvquthos5ruofynwj2xlz4d3ndq6zn5iqra' cta='Download the legend of Pyro' />
        ) : (
          <button disabled={loading} className='buy-button' onClick={processTransaction}>
            Buy now!
          </button>
        )
      }
    </div>
  );
}