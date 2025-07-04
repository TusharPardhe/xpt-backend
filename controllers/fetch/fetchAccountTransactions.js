const { Client } = require('xrpl');

const { API_RESPONSE_CODE } = require('../../constants/app.constants');

const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

const processTransaction = (tx, meta, accountAddress) => {
    const txData = tx.tx || tx;
    const txMeta = meta || tx.meta;

    // Clean up metadata to only include essential fields
    const cleanedMeta = txMeta
        ? {
              TransactionIndex: txMeta.TransactionIndex,
              TransactionResult: txMeta.TransactionResult,
              delivered_amount: txMeta.delivered_amount,
              nftoken_id: txMeta.nftoken_id,
          }
        : null;

    const timestamp = txData.date;
    const rippleEpochOffset = 946684800;
    const formattedDate = formatDate(timestamp + rippleEpochOffset);
    const hash = txData.hash;

    // Basic transaction info
    const transactionInfo = {
        hash,
        date: formattedDate,
        timestamp,
        type: null,
        amount: null,
        formattedAmount: null,
        currency: null,
        otherParty: null,
        address: txData.Account,
        raw: {
            tx: {
                ...txData,
                meta: cleanedMeta,
            },
        },
    };

    // Handle Payment transactions
    if (txData.TransactionType === 'Payment') {
        let amount, currency, formattedAmount;

        // Remove debug logging for production

        // Determine the delivered amount (actual amount that was delivered)
        if (txMeta && txMeta.delivered_amount) {
            if (typeof txMeta.delivered_amount === 'string') {
                // XRP payment (in drops)
                amount = parseInt(txMeta.delivered_amount, 10) / 1000000; // Convert from drops to XRP
                currency = 'XRP';
                formattedAmount = amount.toString();
            } else if (txMeta.delivered_amount.currency && txMeta.delivered_amount.value) {
                // Token payment
                amount = parseFloat(txMeta.delivered_amount.value);

                // Convert hex currency code to string if needed
                if (txMeta.delivered_amount.currency.length > 3) {
                    // This is a hex currency code, try to convert to ASCII
                    try {
                        const hex = txMeta.delivered_amount.currency;
                        // Convert hex to ASCII and remove null bytes
                        currency = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
                    } catch (e) {
                        currency = txMeta.delivered_amount.currency;
                    }
                } else {
                    currency = txMeta.delivered_amount.currency;
                }

                formattedAmount = amount.toString();
            }
        } else if (typeof txData.Amount === 'string') {
            // XRP payment (in drops)
            amount = parseInt(txData.Amount, 10) / 1000000; // Convert from drops to XRP
            currency = 'XRP';
            formattedAmount = amount.toString();
        } else if (txData.Amount && txData.Amount.currency && txData.Amount.value) {
            // Token payment
            amount = parseFloat(txData.Amount.value);

            // Convert hex currency code to string if needed
            if (txData.Amount.currency.length > 3) {
                try {
                    const hex = txData.Amount.currency;
                    currency = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
                } catch (e) {
                    currency = txData.Amount.currency;
                }
            } else {
                currency = txData.Amount.currency;
            }

            formattedAmount = amount.toString();
        }

        // Determine transaction type based on whether the user is sender or receiver
        if (txData.Account === accountAddress) {
            // User is sender
            transactionInfo.type = 'sent';
            transactionInfo.otherParty = txData.Destination;
            transactionInfo.formattedAmount = `- ${formattedAmount}`;
            transactionInfo.amount = `-${amount}`;
        } else if (txData.Destination === accountAddress) {
            // User is receiver
            transactionInfo.type = 'received';
            transactionInfo.otherParty = txData.Account;
            transactionInfo.formattedAmount = `+ ${formattedAmount}`;
            transactionInfo.amount = amount;
        }

        transactionInfo.currency = currency;
    } else if (txData.TransactionType === 'OfferCreate' || txData.TransactionType === 'OfferCancel') {
        // Handle exchange transactions
        transactionInfo.type = 'exchange';

        // Try to extract exchange details from metadata
        if (txMeta && txMeta.AffectedNodes) {
            // This is complex and would require deeper parsing of the metadata
            // to determine exactly what was exchanged
            // For now, we'll just mark it as an exchange
        }
    } else {
        // Handle other transaction types
        transactionInfo.type = txData.TransactionType.toLowerCase();
    }

    return transactionInfo;
};

const fetchAccountTransactions = async (request, response) => {
    try {
        // Get parameters from query instead of body
        let { account, limit, format, ledger, seq } = request.query;
        limit = limit ?? 25;
        ledger = ledger ?? undefined;
        seq = seq ?? undefined;
        // Check if user wants raw format (for developers) or UI format (for frontend)
        const returnRawFormat = format === 'raw';

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();

        if (!(account && limit)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const params = {
            command: 'account_tx',
            account,
            limit: parseInt(limit, 10), // Convert string to number
        };

        if (ledger && seq) {
            params.marker = {
                ledger: parseInt(ledger),
                seq: parseInt(seq),
            };
        }

        const transactionDetails = await client.request(params).catch((err) => {
            response.status(500).send({ error: err.data?.error_message || 'Error fetching transactions' });
            return;
        });

        if (transactionDetails) {
            // If raw format is requested, return original response
            if (returnRawFormat) {
                response.status(200).send({ ...transactionDetails.result });
            } else {
                const processedTransactions = transactionDetails.result.transactions.map((txRecord) =>
                    processTransaction(txRecord, txRecord.meta, account)
                );

                // Send the formatted response
                response.status(200).send({
                    transactions: processedTransactions,
                    account,
                    limit: transactionDetails.result.limit,
                    marker: transactionDetails.result.marker, // This should be the NEW marker for next page
                });
            }
        }

        await client.disconnect();
    } catch (err) {
        console.log(err);
        response.status(500).send({ error: API_RESPONSE_CODE[500] });
    }
    return;
};

module.exports = fetchAccountTransactions;
