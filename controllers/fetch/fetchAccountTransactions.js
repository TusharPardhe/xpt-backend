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

    if (txMeta?.AffectedNodes) {
        delete txMeta.AffectedNodes;
    }

    const timestamp = txData.date;
    const formattedDate = formatDate(timestamp);
    const hash = txData.hash;

    // Basic transaction info
    const transactionInfo = {
        hash,
        date: formattedDate,
        timestamp,
        type: null,
        displayType: null,
        amount: null,
        formattedAmount: null,
        currency: null,
        otherParty: null,
        address: txData.Account,
        raw: { tx: txData, meta: txMeta },
    };

    // Handle Payment transactions
    if (txData.TransactionType === 'Payment') {
        let amount, currency, formattedAmount;

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
            transactionInfo.displayType = `Sent to ${txData.Destination}`;
            transactionInfo.otherParty = txData.Destination;
            transactionInfo.formattedAmount = `- ${formattedAmount}`;
            transactionInfo.amount = `-${amount}`;
        } else if (txData.Destination === accountAddress) {
            // User is receiver
            transactionInfo.type = 'received';
            transactionInfo.displayType = `Received from ${txData.Account}`;
            transactionInfo.otherParty = txData.Account;
            transactionInfo.formattedAmount = `+ ${formattedAmount}`;
            transactionInfo.amount = amount;
        }

        transactionInfo.currency = currency;
    } else if (txData.TransactionType === 'OfferCreate' || txData.TransactionType === 'OfferCancel') {
        // Handle exchange transactions
        transactionInfo.type = 'exchange';
        transactionInfo.displayType = 'Exchange';

        // Try to extract exchange details from metadata
        if (txMeta && txMeta.AffectedNodes) {
            // This is complex and would require deeper parsing of the metadata
            // to determine exactly what was exchanged
            // For now, we'll just mark it as an exchange
        }
    } else {
        // Handle other transaction types
        transactionInfo.type = txData.TransactionType.toLowerCase();
        transactionInfo.displayType = txData.TransactionType;
    }

    return transactionInfo;
};

const fetchAccountTransactions = async (request, response) => {
    try {
        // Get parameters from query instead of body
        let { account, limit, format, marker } = request.query;
        limit = limit ?? 25;
        marker = marker ?? undefined;
        // Check if user wants raw format (for developers) or UI format (for frontend)
        const returnRawFormat = format === 'raw';

        const client = new Client(process.env.XRPL_SERVER, { connectionTimeout: 10000 });
        await client.connect();
        console.log('Connected to XRPL server', {
            limit,
            account,
        });
        if (!(account && limit)) {
            response.status(400).send({ error: API_RESPONSE_CODE[400] });
            return;
        }

        const transactionDetails = await client
            .request({
                command: 'account_tx',
                account,
                marker,
                limit: parseInt(limit, 10), // Convert string to number
            })
            .catch((err) => {
                response.status(500).send({ error: err.data?.error_message || 'Error fetching transactions' });
                return;
            });

        if (transactionDetails) {
            // If raw format is requested, return original response
            if (returnRawFormat) {
                response.status(200).send({ ...transactionDetails.result });
            } else {
                // Process transactions into a more user-friendly format
                const processedTransactions = transactionDetails.result.transactions.map((tx) => processTransaction(tx, null, account));

                // Send the formatted response
                response.status(200).send({
                    transactions: processedTransactions,
                    account,
                    // Include other metadata from the original response
                    ledger_index_min: transactionDetails.result.ledger_index_min,
                    ledger_index_max: transactionDetails.result.ledger_index_max,
                    limit: transactionDetails.result.limit,
                    marker: transactionDetails.result.marker,
                    validated: transactionDetails.result.validated,
                    // Add a raw data field that can be toggled on the front end
                    raw: returnRawFormat ? transactionDetails.result : undefined,
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
