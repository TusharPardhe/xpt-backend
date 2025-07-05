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
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
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

const parseWalletCommand = async (message, contacts = []) => {
    if (!message) {
        throw new Error('Missing message');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY in environment variables');
    }

    const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const prompt = `
        Parse the following message into a wallet command structure. Focus ONLY on extracting intent and entities, do NOT try to validate if contacts exist.
        
        Valid actions:
        - payment: When the user wants to send/pay/transfer XRP or other currency to someone
        - check_balance: When user asks about their balance
        - get_address: When user asks for their wallet address
        - contact_search: When user wants to find a contact
        - contact_add: When user wants to add a new contact
        - transaction_history: When user wants to see transaction history
        - backup_help: When user asks about backing up their wallet
        - xrp_info: When user asks about what XRP is
        - seed_info: When user asks about their seed phrase
        - wallet_navigation: When user wants to navigate to another section of the wallet
        - direct_navigation: When user explicitly wants to navigate somewhere (e.g., "go to transactions", "navigate to settings", "take me to contacts")
        - unknown: When the intent doesn't match any of the above
        
        For payment actions, extract:
        - recipient: Extract the name/identifier exactly as mentioned (could be contact name, address, or any identifier)
        - amount: The payment amount (as a string, extract numbers like "10", "1.5", etc.)
        - currency: The currency (default to "XRP" if not specified or if "XRP" is mentioned)
        
        For direct_navigation actions, extract:
        - destination: The target page (transactions, contacts, settings, accounts, send, escrows, web-connections, home, ai-assistant)
        
        CRITICAL: For payments, ALWAYS extract the recipient as mentioned, regardless of whether it looks like a contact name or address. The frontend will handle contact resolution.
        
        Examples:
        - "Send 1XRP to T" -> {"action":"payment","recipient":"T","amount":"1","currency":"XRP","confidence":0.9}
        - "Send 10 XRP to John" -> {"action":"payment","recipient":"John","amount":"10","currency":"XRP","confidence":0.9}
        - "Transfer 5 to rXXXXX" -> {"action":"payment","recipient":"rXXXXX","amount":"5","currency":"XRP","confidence":0.9}
        - "Pay Alice 20" -> {"action":"payment","recipient":"Alice","amount":"20","currency":"XRP","confidence":0.9}
        - "Navigate to transactions" -> {"action":"direct_navigation","destination":"transactions","confidence":0.9}
        - "Go to settings" -> {"action":"direct_navigation","destination":"settings","confidence":0.9}
        - "Take me to contacts" -> {"action":"direct_navigation","destination":"contacts","confidence":0.9}
        - "Show escrows" -> {"action":"direct_navigation","destination":"escrows","confidence":0.9}
        - "Open accounts page" -> {"action":"direct_navigation","destination":"accounts","confidence":0.9}
        
        For contact_add, extract:
        - contactName: The name to save
        - address: The XRP address to save
        
        For all actions, include a confidence score between 0 and 1.
        Set confidence to 0.9+ for clear payment intents with amount and recipient.
        Set confidence to 0.9+ for clear navigation intents.
        
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
                };
            }
        } else {
            return {
                action: 'unknown',
                confidence: 0.5,
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
