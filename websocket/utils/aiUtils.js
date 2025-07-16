const axios = require('axios');

const processAIRequest = async (prompt) => {
    if (!prompt) {
        throw new Error('Missing prompt');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY in environment variables');
    }

    const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    //  Prompt with comprehensive professional instructions
    const professionalPrompt = `You are a professional cryptocurrency and blockchain wallet assistant for a financial application. 
        RESPONSE STYLE REQUIREMENTS:
        - Use formal, business-appropriate language at all times
        - NEVER use emojis, emoticons, or casual expressions
        - Maintain a professional, courteous, and informative tone
        - Use proper grammar and complete sentences
        - Be precise and technical when discussing cryptocurrency concepts
        - Provide clear, actionable information
        - Keep responses concise and focused
        - Use industry-standard terminology correctly

        FORBIDDEN ELEMENTS:
        - No emojis or emoticons (😊, 🚀, 💰, etc.)
        - No casual greetings (hey, hi there, yo, sup)
        - No exclamation overuse (avoid multiple !!! or ???)
        - No informal expressions (awesome, cool, wow, amazing, sweet, lol, etc.)
        - No text speak or abbreviations (btw, fyi, tbh, omg, etc.)
        - No overly enthusiastic language

        PREFERRED LANGUAGE PATTERNS:
        - "I recommend..." instead of "You should totally..."
        - "Please consider..." instead of "You might want to..."
        - "This functionality allows..." instead of "This is super cool because..."
        - "The current market value..." instead of "The price is..."
        - "Your transaction will..." instead of "Your tx will..."

        CONTENT GUIDELINES:
        - Provide accurate cryptocurrency and blockchain information
        - Explain wallet functions clearly and professionally
        - Offer step-by-step guidance when appropriate
        - Include relevant security considerations
        - Maintain user privacy and data protection awareness

        User query: ${prompt}

        Please provide a professional response following these guidelines:`;

    const apiResponse = await axios.post(
        `${GEMINI_API_ENDPOINT}?key=${apiKey}`,
        {
            contents: [
                {
                    parts: [
                        {
                            text: professionalPrompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.7,
                maxOutputTokens: 300,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
            ],
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (apiResponse.data.candidates && apiResponse.data.candidates[0] && apiResponse.data.candidates[0].content) {
        return apiResponse.data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Invalid response from AI API');
    }
};

const parseWalletCommand = async (message, contacts = [], context = {}) => {
    if (!message) {
        throw new Error('Missing message');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY in environment variables');
    }

    const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // Build context-aware prompt
    let contextInfo = '';
    if (context.previousCommands && context.previousCommands.length > 0) {
        contextInfo += `\nRecent conversation context:\n`;
        context.previousCommands.slice(-3).forEach((cmd, index) => {
            contextInfo += `${index + 1}. User did: ${cmd.action} ${cmd.recipient || cmd.destination || ''}\n`;
        });
    }

    if (context.mentionedEntities && context.mentionedEntities.length > 0) {
        contextInfo += `\nPreviously mentioned: ${context.mentionedEntities.slice(-5).join(', ')}\n`;
    }

    const prompt = `
        Parse the following message into a wallet command structure with enhanced natural language understanding.
        Focus ONLY on extracting intent and entities, do NOT try to validate if contacts exist.
        
        ${contextInfo}
        
        Valid actions:
        - payment: When the user wants to send/pay/transfer XRP or other currency to someone
        - check_balance: When user asks about their balance, money, funds, wallet amount
        - get_address: When user asks for their wallet address, receive address, account ID
        - contact_search: When user wants to find a contact, friend, person in address book
        - contact_add: When user wants to add a new contact, save an address
        - transaction_history: When user wants to see transaction history, payments, transfers, activity
        - backup_help: When user asks about backing up their wallet, security, seed phrase backup
        - xrp_info: When user asks about what XRP is, cryptocurrency information
        - seed_info: When user asks about their seed phrase, recovery phrase, wallet backup
        - wallet_navigation: When user wants to navigate to another section of the wallet
        - direct_navigation: When user explicitly wants to navigate somewhere (e.g., "go to transactions", "navigate to settings", "take me to contacts")
        - price_check: When user asks about cryptocurrency prices, token prices, market values, exchange rates
        - unknown: When the intent doesn't match any of the above
        
        ENHANCED SYNONYM RECOGNITION:
        - Balance: money, funds, cash, wallet amount, how much, available, balance
        - Send/Payment: pay, transfer, give, wire, remit, transmit, send money
        - Transaction: payment, transfer, activity, movement, record, history
        - Address: wallet ID, account number, receive address, my ID, wallet address
        - Contact: friend, person, saved address, address book entry, people
        - Show/Display: view, see, get, fetch, retrieve, display, show me
        - Check: look at, examine, verify, confirm, tell me
        
        CONTEXT-AWARE PARSING:
        - If user says "him", "her", "them" and there's a recent contact mention, use that contact
        - If user says "that", "it" and refers to previous action, infer the intent
        - If user says "more", "details", "full" after transaction history, suggest navigation
        - Handle casual language like "how much do I have", "where's my money", "send some XRP"
        
        NAVIGATION SHORTCUTS:
        - Home: dashboard, main page, start, home screen
        - Settings: preferences, config, options, account settings
        - Accounts: wallets, my wallets, wallet list, account list
        - Transactions: history, payments, activity, transaction log
        - Contacts: address book, friends, people, saved addresses
        - Send: pay, transfer, payment, send money
        - Portfolio: assets, tokens, holdings, my tokens
        
        For payment actions, extract:
        - recipient: Extract the name/identifier exactly as mentioned (could be contact name, address, or any identifier)
        - amount: The payment amount (as a string, extract numbers like "10", "1.5", etc.)
        - currency: The currency (default to "XRP" if not specified or if "XRP" is mentioned)
        
        For direct_navigation actions, extract:
        - destination: The target page (transactions, contacts, settings, accounts, send, escrows, web-connections, home, ai-assistant)
        
        For price_check actions, extract:
        - currency: The cryptocurrency or token symbol/name (e.g., "XRP", "BTC", "ETH", "USD", "EUR", or token name)
        - targetCurrency: The target currency for conversion (default to "USD" if not specified)
        - isTokenPrice: Set to true if asking about a specific token they hold, false for major cryptocurrencies
        
        CRITICAL: For payments, ALWAYS extract the recipient as mentioned, regardless of whether it looks like a contact name or address. The frontend will handle contact resolution.
        
        Examples:
        
        PAYMENT EXAMPLES:
        - "Send 1XRP to T" -> {"action":"payment","recipient":"T","amount":"1","currency":"XRP","confidence":0.9}
        - "Send 10 XRP to John" -> {"action":"payment","recipient":"John","amount":"10","currency":"XRP","confidence":0.9}
        - "Transfer 5 to rXXXXX" -> {"action":"payment","recipient":"rXXXXX","amount":"5","currency":"XRP","confidence":0.9}
        - "Pay Alice 20" -> {"action":"payment","recipient":"Alice","amount":"20","currency":"XRP","confidence":0.9}
        - "Send money to Bob" -> {"action":"payment","recipient":"Bob","confidence":0.8}
        - "Transfer 100 XRP to Sarah" -> {"action":"payment","recipient":"Sarah","amount":"100","currency":"XRP","confidence":0.9}
        - "Pay 0.5 XRP to Mike" -> {"action":"payment","recipient":"Mike","amount":"0.5","currency":"XRP","confidence":0.9}
        - "Send 25 to my friend" -> {"action":"payment","recipient":"my friend","amount":"25","currency":"XRP","confidence":0.8}
        - "I want to pay someone" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Send XRP" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        
        BALANCE CHECK EXAMPLES:
        - "What's my balance?" -> {"action":"check_balance","confidence":0.9}
        - "Check my wallet balance" -> {"action":"check_balance","confidence":0.9}
        - "How much XRP do I have?" -> {"action":"check_balance","confidence":0.9}
        - "Show my balance" -> {"action":"check_balance","confidence":0.9}
        - "How much money do I have?" -> {"action":"check_balance","confidence":0.9}
        - "Check balance" -> {"action":"check_balance","confidence":0.9}
        - "What's in my wallet?" -> {"action":"check_balance","confidence":0.9}
        - "Current balance" -> {"action":"check_balance","confidence":0.9}
        - "Balance check" -> {"action":"check_balance","confidence":0.9}
        
        ADDRESS EXAMPLES:
        - "Show my address" -> {"action":"get_address","confidence":0.9}
        - "What's my wallet address?" -> {"action":"get_address","confidence":0.9}
        - "Get my address" -> {"action":"get_address","confidence":0.9}
        - "My wallet address" -> {"action":"get_address","confidence":0.9}
        - "Show address" -> {"action":"get_address","confidence":0.9}
        - "Wallet address" -> {"action":"get_address","confidence":0.9}
        - "Display my address" -> {"action":"get_address","confidence":0.9}
        
        CONTACT EXAMPLES:
        - "Find contact John" -> {"action":"contact_search","contactName":"John","confidence":0.9}
        - "Search for Alice in contacts" -> {"action":"contact_search","contactName":"Alice","confidence":0.9}
        - "Look for Bob" -> {"action":"contact_search","contactName":"Bob","confidence":0.9}
        - "Find Sarah" -> {"action":"contact_search","contactName":"Sarah","confidence":0.9}
        - "Search contact Mike" -> {"action":"contact_search","contactName":"Mike","confidence":0.9}
        
        TRANSACTION HISTORY EXAMPLES:
        - "Show my transactions" -> {"action":"transaction_history","confidence":0.9}
        - "Transaction history" -> {"action":"transaction_history","confidence":0.9}
        - "My recent payments" -> {"action":"transaction_history","confidence":0.9}
        - "Payment history" -> {"action":"transaction_history","confidence":0.9}
        - "Show transactions" -> {"action":"transaction_history","confidence":0.9}
        - "Recent transactions" -> {"action":"transaction_history","confidence":0.9}
        - "Transaction list" -> {"action":"transaction_history","confidence":0.9}
        - "My payments" -> {"action":"transaction_history","confidence":0.9}
        - "Show my payment history" -> {"action":"transaction_history","confidence":0.9}
        
        NAVIGATION EXAMPLES (COMPREHENSIVE):
        
        HOME NAVIGATION:
        - "Go home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Take me home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Navigate to home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Home page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Main dashboard" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Dashboard" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Start page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Main page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Go to main" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Take me to home page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Go to home page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Navigate to home page" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Show me home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Open home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Back to home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Return to home" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Go to dashboard" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Show dashboard" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        - "Open dashboard" -> {"action":"direct_navigation","destination":"home","confidence":0.9}
        
        SETTINGS NAVIGATION:
        - "Go to settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Open settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Settings page" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "App settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Preferences" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Configuration" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Options" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Account settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Show settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Navigate to settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Take me to settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Settings menu" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Go to preferences" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Show preferences" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Open preferences" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Application settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Wallet settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "User settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "System settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        
        ACCOUNTS/WALLETS NAVIGATION:
        - "Go to accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Show my accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "My wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Wallet list" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Account list" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "View accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Open accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Accounts page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Show wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Navigate to accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Take me to accounts" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Go to wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Take me to wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Navigate to wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Show wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Open wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Wallet page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Go to my wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Show my wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        - "Take me to my wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        
        TRANSACTIONS NAVIGATION:
        - "Go to transactions" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Navigate to transactions" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Transaction page" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Payment history" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Transaction log" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Activity page" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Show all transactions" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Full transaction history" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Payment log" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        
        CONTACTS NAVIGATION:
        - "Go to contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Take me to contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Show contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Address book" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Contact list" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "My contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Friends list" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "People" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Saved addresses" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        
        SEND/PAYMENT NAVIGATION:
        - "Go to send" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Send page" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Payment page" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Send money" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Make payment" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Transfer funds" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Send XRP" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Pay someone" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        - "Transfer page" -> {"action":"direct_navigation","destination":"send","confidence":0.9}
        
        PORTFOLIO NAVIGATION:
        - "Go to portfolio" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "Portfolio page" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "My assets" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "Token list" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "Holdings" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "My tokens" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "Asset overview" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        - "Show portfolio" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.9}
        
        ESCROWS NAVIGATION:
        - "Go to escrows" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "Show escrows" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "Escrow page" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "Conditional payments" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "Escrow list" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "My escrows" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        
        WEB CONNECTIONS NAVIGATION:
        - "Web connections" -> {"action":"direct_navigation","destination":"web-connections","confidence":0.9}
        - "Connected apps" -> {"action":"direct_navigation","destination":"web-connections","confidence":0.9}
        - "Linked apps" -> {"action":"direct_navigation","destination":"web-connections","confidence":0.9}
        - "App connections" -> {"action":"direct_navigation","destination":"web-connections","confidence":0.9}
        - "Connected services" -> {"action":"direct_navigation","destination":"web-connections","confidence":0.9}
        
        NETWORK SETTINGS NAVIGATION:
        - "Network settings" -> {"action":"direct_navigation","destination":"network-settings","confidence":0.9}
        - "Server settings" -> {"action":"direct_navigation","destination":"network-settings","confidence":0.9}
        - "Node settings" -> {"action":"direct_navigation","destination":"network-settings","confidence":0.9}
        - "Network config" -> {"action":"direct_navigation","destination":"network-settings","confidence":0.9}
        
        CREATE ESCROW NAVIGATION:
        - "Create escrow" -> {"action":"direct_navigation","destination":"create-escrow","confidence":0.9}
        - "New escrow" -> {"action":"direct_navigation","destination":"create-escrow","confidence":0.9}
        - "Add escrow" -> {"action":"direct_navigation","destination":"create-escrow","confidence":0.9}
        - "Make escrow" -> {"action":"direct_navigation","destination":"create-escrow","confidence":0.9}
        
        AI ASSISTANT NAVIGATION:
        - "AI assistant" -> {"action":"direct_navigation","destination":"ai-assistant","confidence":0.9}
        - "Assistant" -> {"action":"direct_navigation","destination":"ai-assistant","confidence":0.9}
        - "Chat" -> {"action":"direct_navigation","destination":"ai-assistant","confidence":0.9}
        - "Help" -> {"action":"direct_navigation","destination":"ai-assistant","confidence":0.9}
        
        CASUAL NAVIGATION PATTERNS:
        - "Take me to the main screen" -> {"action":"direct_navigation","destination":"home","confidence":0.8}
        - "I want to go home" -> {"action":"direct_navigation","destination":"home","confidence":0.8}
        - "Show me the settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.8}
        - "Let me see my wallets" -> {"action":"direct_navigation","destination":"accounts","confidence":0.8}
        - "I need to send money" -> {"action":"direct_navigation","destination":"send","confidence":0.8}
        - "Where are my contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.8}
        - "Show me my transaction history" -> {"action":"direct_navigation","destination":"transactions","confidence":0.8}
        - "I want to check my portfolio" -> {"action":"direct_navigation","destination":"portfolio","confidence":0.8}
        
        COMPOUND NAVIGATION (ADVANCED):
        - "Go to settings and show security" -> {"action":"direct_navigation","destination":"settings","parameters":{"section":"security"},"confidence":0.8}
        - "Take me to accounts and add wallet" -> {"action":"direct_navigation","destination":"accounts","parameters":{"action":"add"},"confidence":0.8}
        - "Open contacts and add new contact" -> {"action":"direct_navigation","destination":"contacts","parameters":{"action":"add"},"confidence":0.8}
        
        PRICE CHECK EXAMPLES (EXTENSIVE):
        - "What's the current XRP price?" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP price in EUR" -> {"action":"price_check","currency":"XRP","targetCurrency":"EUR","confidence":0.9}
        - "XRP price in INR" -> {"action":"price_check","currency":"XRP","targetCurrency":"INR","confidence":0.9}
        - "Current XRP price in INR" -> {"action":"price_check","currency":"XRP","targetCurrency":"INR","confidence":0.9}
        - "What is current XRP price in INR" -> {"action":"price_check","currency":"XRP","targetCurrency":"INR","confidence":0.9}
        - "XRP to INR" -> {"action":"price_check","currency":"XRP","targetCurrency":"INR","confidence":0.9}
        - "Price of XRP in Indian rupees" -> {"action":"price_check","currency":"XRP","targetCurrency":"INR","confidence":0.9}
        - "What's the current price of Bitcoin in Indian rupee" -> {"action":"price_check","currency":"BTC","targetCurrency":"INR","confidence":0.9}
        - "Bitcoin price in INR" -> {"action":"price_check","currency":"BTC","targetCurrency":"INR","confidence":0.9}
        - "BTC to INR" -> {"action":"price_check","currency":"BTC","targetCurrency":"INR","confidence":0.9}
        - "Bitcoin price" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "How much is Ethereum worth?" -> {"action":"price_check","currency":"ETH","targetCurrency":"USD","confidence":0.9}
        - "Ethereum price in Indian rupee" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "ETH price in EUR" -> {"action":"price_check","currency":"ETH","targetCurrency":"EUR","confidence":0.9}
        - "Current Bitcoin price" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "BTC price now" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Price of Bitcoin" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "What is Bitcoin worth now" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Check Bitcoin price" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Show me Bitcoin value" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Bitcoin value in dollars" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "BTC USD price" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Current BTC rate" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Bitcoin market price" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "What's Bitcoin trading at" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Bitcoin cost" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "How much does Bitcoin cost" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Bitcoin worth" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Value of Bitcoin" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "Bitcoin exchange rate" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "What's the rate of Bitcoin" -> {"action":"price_check","currency":"BTC","targetCurrency":"USD","confidence":0.9}
        - "XRP price today" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Today's XRP price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP rate" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP value" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "How much is XRP" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP cost" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP worth" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Current XRP value" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP market price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP trading price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "What's XRP worth" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Price check XRP" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Check XRP price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP price check" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Show XRP price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Display XRP value" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Get XRP price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Fetch XRP rate" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "Tell me XRP price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP to USD" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP in dollars" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP USD rate" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP dollar price" -> {"action":"price_check","currency":"XRP","targetCurrency":"USD","confidence":0.9}
        - "XRP to euro" -> {"action":"price_check","currency":"XRP","targetCurrency":"EUR","confidence":0.9}
        - "XRP in euros" -> {"action":"price_check","currency":"XRP","targetCurrency":"EUR","confidence":0.9}
        - "XRP EUR price" -> {"action":"price_check","currency":"XRP","targetCurrency":"EUR","confidence":0.9}
        - "XRP price in GBP" -> {"action":"price_check","currency":"XRP","targetCurrency":"GBP","confidence":0.9}
        - "XRP to GBP" -> {"action":"price_check","currency":"XRP","targetCurrency":"GBP","confidence":0.9}
        - "XRP in pounds" -> {"action":"price_check","currency":"XRP","targetCurrency":"GBP","confidence":0.9}
        - "XRP pound price" -> {"action":"price_check","currency":"XRP","targetCurrency":"GBP","confidence":0.9}
        - "XRP price in Japanese yen" -> {"action":"price_check","currency":"XRP","targetCurrency":"JPY","confidence":0.9}
        - "XRP to JPY" -> {"action":"price_check","currency":"XRP","targetCurrency":"JPY","confidence":0.9}
        - "XRP in yen" -> {"action":"price_check","currency":"XRP","targetCurrency":"JPY","confidence":0.9}
        - "XRP yen price" -> {"action":"price_check","currency":"XRP","targetCurrency":"JPY","confidence":0.9}
        - "XRP price in Canadian dollars" -> {"action":"price_check","currency":"XRP","targetCurrency":"CAD","confidence":0.9}
        - "XRP to CAD" -> {"action":"price_check","currency":"XRP","targetCurrency":"CAD","confidence":0.9}
        - "XRP in CAD" -> {"action":"price_check","currency":"XRP","targetCurrency":"CAD","confidence":0.9}
        - "Ethereum price in Indian rupees" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "ETH to INR" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "ETH price in INR" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "Ethereum price in rupees" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "What's Ethereum worth in INR" -> {"action":"price_check","currency":"ETH","targetCurrency":"INR","confidence":0.9}
        - "Current Ethereum price" -> {"action":"price_check","currency":"ETH","targetCurrency":"USD","confidence":0.9}
        - "ETH price" -> {"action":"price_check","currency":"ETH","targetCurrency":"USD","confidence":0.9}
        - "ETH value" -> {"action":"price_check","currency":"ETH","targetCurrency":"USD","confidence":0.9}
        - "Litecoin price" -> {"action":"price_check","currency":"LTC","targetCurrency":"USD","confidence":0.9}
        - "LTC price" -> {"action":"price_check","currency":"LTC","targetCurrency":"USD","confidence":0.9}
        - "Cardano price" -> {"action":"price_check","currency":"ADA","targetCurrency":"USD","confidence":0.9}
        - "ADA price" -> {"action":"price_check","currency":"ADA","targetCurrency":"USD","confidence":0.9}
        - "Polkadot price" -> {"action":"price_check","currency":"DOT","targetCurrency":"USD","confidence":0.9}
        - "DOT price" -> {"action":"price_check","currency":"DOT","targetCurrency":"USD","confidence":0.9}
        - "Chainlink price" -> {"action":"price_check","currency":"LINK","targetCurrency":"USD","confidence":0.9}
        - "LINK price" -> {"action":"price_check","currency":"LINK","targetCurrency":"USD","confidence":0.9}
        - "Price of my SOLO tokens" -> {"action":"price_check","currency":"SOLO","isTokenPrice":true,"confidence":0.9}
        - "What's my token worth?" -> {"action":"price_check","isTokenPrice":true,"confidence":0.8}
        - "Show me crypto prices" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        - "Market value of XRP" -> {"action":"price_check","currency":"XRP","confidence":0.9}
        - "Crypto prices" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        - "Current crypto rates" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        - "Cryptocurrency prices" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        - "Token prices" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        - "Digital currency prices" -> {"action":"price_check","currency":"XRP","confidence":0.8}
        
        OTHER EXAMPLES:
        - "How to backup my wallet?" -> {"action":"backup_help","confidence":0.9}
        - "Backup wallet" -> {"action":"backup_help","confidence":0.9}
        - "Wallet backup" -> {"action":"backup_help","confidence":0.9}
        - "Backup help" -> {"action":"backup_help","confidence":0.9}
        - "How do I backup" -> {"action":"backup_help","confidence":0.9}
        - "What is XRP?" -> {"action":"xrp_info","confidence":0.9}
        - "Tell me about XRP" -> {"action":"xrp_info","confidence":0.9}
        - "XRP info" -> {"action":"xrp_info","confidence":0.9}
        - "What's XRP" -> {"action":"xrp_info","confidence":0.9}
        - "Explain XRP" -> {"action":"xrp_info","confidence":0.9}
        - "Tell me about my seed phrase" -> {"action":"seed_info","confidence":0.9}
        - "Seed phrase info" -> {"action":"seed_info","confidence":0.9}
        - "What is seed phrase" -> {"action":"seed_info","confidence":0.9}
        - "Seed phrase help" -> {"action":"seed_info","confidence":0.9}
        - "My seed phrase" -> {"action":"seed_info","confidence":0.9}
        
        For contact_add, extract:
        - contactName: The name to save
        - address: The XRP address to save
        
        For all actions, include a confidence score between 0 and 1.
        Set confidence to 0.9+ for clear payment intents with amount and recipient.
        Set confidence to 0.9+ for clear navigation intents.
        Set confidence to 0.9+ for clear price check requests with specific currency.
        Set confidence to 0.8+ for general price requests without specific currency.
        
        Message to parse: "${message}"
        
        Return ONLY a valid JSON object with no additional text or formatting.
    `;

    const apiResponse = await axios.post(
        `${GEMINI_API_ENDPOINT}?key=${apiKey}`,
        {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.1,
                maxOutputTokens: 300,
            },
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (apiResponse.data.candidates && apiResponse.data.candidates[0] && apiResponse.data.candidates[0].content) {
        const textResponse = apiResponse.data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\{.*\}/s);

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse JSON from AI response:', textResponse);
                return {
                    error: 'Failed to parse command',
                    action: 'unknown',
                    confidence: 0.5,
                    message: 'I apologize, but I encountered an error while processing your request. Please try rephrasing your command or contact support if the issue persists.',
                };
            }
        } else {
            return {
                action: 'unknown',
                confidence: 0.5,
                message: 'I apologize, but I was unable to understand your request. Please try rephrasing your command or use one of the following supported actions: send payment, check balance, view transactions, navigate to settings, or ask for help with wallet features.',
            };
        }
    } else {
        throw new Error('Invalid response from AI API');
    }
};

module.exports = {
    processAIRequest,
    parseWalletCommand,
};
