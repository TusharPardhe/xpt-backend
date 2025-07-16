/**
 * Typing Animation Utility
 * Provides smooth typing effects for AI responses
 */

class TypingAnimator {
    constructor(options = {}) {
        this.defaultOptions = {
            typingSpeed: 50,           // milliseconds between characters
            pauseOnPunctuation: 200,   // extra pause on punctuation
            pauseOnSpace: 25,          // extra pause on spaces
            chunkSize: 3,              // characters to type at once for smoother effect
            minSpeed: 25,              // minimum typing speed
            maxSpeed: 100,             // maximum typing speed
            naturalVariation: true,    // add natural speed variations
            ...options
        };
    }

    /**
     * Creates a typing animation stream for a given text
     * @param {string} text - The text to animate
     * @param {Object} options - Animation options
     * @returns {AsyncGenerator} - Async generator yielding text chunks
     */
    async* createTypingStream(text, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        if (!text || typeof text !== 'string') {
            yield { chunk: '', isComplete: true, currentText: '' };
            return;
        }

        let currentText = '';
        let charIndex = 0;
        
        while (charIndex < text.length) {
            const char = text[charIndex];
            const isLastChar = charIndex === text.length - 1;
            
            currentText += char;
            
            // Calculate dynamic typing speed with natural variation
            let delay = config.typingSpeed;
            
            if (config.naturalVariation) {
                // Add random variation to make typing more natural
                const variation = Math.random() * 30 - 15; // ±15ms variation
                delay += variation;
            }
            
            // Add pauses for punctuation and spaces
            if (/[.!?]/.test(char)) {
                delay += config.pauseOnPunctuation;
            } else if (char === ' ') {
                delay += config.pauseOnSpace;
            } else if (/[,;:]/.test(char)) {
                delay += config.pauseOnPunctuation / 2;
            }
            
            // Ensure delay stays within bounds
            delay = Math.max(config.minSpeed, Math.min(config.maxSpeed, delay));
            
            yield {
                chunk: char,
                currentText: currentText,
                isComplete: isLastChar,
                progress: ((charIndex + 1) / text.length) * 100,
                charIndex: charIndex + 1,
                totalChars: text.length
            };
            
            if (!isLastChar) {
                await this.sleep(delay);
            }
            
            charIndex++;
        }
    }

    /**
     * Creates a word-by-word typing animation
     * @param {string} text - The text to animate
     * @param {Object} options - Animation options
     * @returns {AsyncGenerator} - Async generator yielding word chunks
     */
    async* createWordTypingStream(text, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        if (!text || typeof text !== 'string') {
            yield { chunk: '', isComplete: true, currentText: '' };
            return;
        }

        const words = text.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const isLastWord = i === words.length - 1;
            const space = isLastWord ? '' : ' ';
            
            currentText += word + space;
            
            yield {
                chunk: word + space,
                currentText: currentText,
                isComplete: isLastWord,
                progress: ((i + 1) / words.length) * 100,
                wordIndex: i + 1,
                totalWords: words.length
            };
            
            if (!isLastWord) {
                // Calculate delay based on word length and punctuation
                let delay = config.typingSpeed * 3; // Base delay for words
                
                if (/[.!?]$/.test(word)) {
                    delay += config.pauseOnPunctuation;
                } else if (/[,;:]$/.test(word)) {
                    delay += config.pauseOnPunctuation / 2;
                }
                
                await this.sleep(delay);
            }
        }
    }

    /**
     * Creates a sentence-by-sentence typing animation
     * @param {string} text - The text to animate
     * @param {Object} options - Animation options
     * @returns {AsyncGenerator} - Async generator yielding sentence chunks
     */
    async* createSentenceTypingStream(text, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        if (!text || typeof text !== 'string') {
            yield { chunk: '', isComplete: true, currentText: '' };
            return;
        }

        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentText = '';
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const isLastSentence = i === sentences.length - 1;
            const space = isLastSentence ? '' : ' ';
            
            currentText += sentence + space;
            
            yield {
                chunk: sentence + space,
                currentText: currentText,
                isComplete: isLastSentence,
                progress: ((i + 1) / sentences.length) * 100,
                sentenceIndex: i + 1,
                totalSentences: sentences.length
            };
            
            if (!isLastSentence) {
                await this.sleep(config.pauseOnPunctuation * 2);
            }
        }
    }

    /**
     * Utility function to create a delay
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} - Promise that resolves after the delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculates optimal typing speed based on text length
     * @param {string} text - The text to analyze
     * @returns {number} - Optimal typing speed in milliseconds
     */
    calculateOptimalSpeed(text) {
        if (!text) return this.defaultOptions.typingSpeed;
        
        const length = text.length;
        
        // Adjust speed based on text length
        if (length < 50) return 60;      // Slower for short text
        if (length < 100) return 50;     // Medium speed
        if (length < 200) return 40;     // Faster for longer text
        return 30;                       // Very fast for very long text
    }

    /**
     * Estimates total animation duration
     * @param {string} text - The text to analyze
     * @param {Object} options - Animation options
     * @returns {number} - Estimated duration in milliseconds
     */
    estimateDuration(text, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        if (!text) return 0;
        
        let totalTime = 0;
        const chars = text.split('');
        
        chars.forEach(char => {
            totalTime += config.typingSpeed;
            
            if (/[.!?]/.test(char)) {
                totalTime += config.pauseOnPunctuation;
            } else if (char === ' ') {
                totalTime += config.pauseOnSpace;
            } else if (/[,;:]/.test(char)) {
                totalTime += config.pauseOnPunctuation / 2;
            }
        });
        
        return totalTime;
    }
}

/**
 * Convenience functions for common use cases
 */

/**
 * Simple typing animation for AI responses
 * @param {string} text - Text to animate
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Animation options
 */
async function typeText(text, onChunk, options = {}) {
    const animator = new TypingAnimator(options);
    
    for await (const chunk of animator.createTypingStream(text, options)) {
        onChunk(chunk);
    }
}

/**
 * Word-by-word typing animation
 * @param {string} text - Text to animate
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Animation options
 */
async function typeWords(text, onChunk, options = {}) {
    const animator = new TypingAnimator(options);
    
    for await (const chunk of animator.createWordTypingStream(text, options)) {
        onChunk(chunk);
    }
}

/**
 * Creates a typing effect for WebSocket responses
 * @param {Object} socket - WebSocket connection
 * @param {string} text - Text to animate
 * @param {string} eventName - Event name to emit
 * @param {Object} options - Animation options
 */
async function emitTypingAnimation(socket, text, eventName, options = {}) {
    const animator = new TypingAnimator(options);
    
    // Emit typing start event
    socket.emit(`${eventName}:typing:start`, {
        totalChars: text.length,
        estimatedDuration: animator.estimateDuration(text, options)
    });
    
    try {
        for await (const chunk of animator.createTypingStream(text, options)) {
            socket.emit(`${eventName}:typing:chunk`, chunk);
        }
        
        // Emit typing complete event
        socket.emit(`${eventName}:typing:complete`, {
            finalText: text,
            completed: true
        });
        
    } catch (error) {
        socket.emit(`${eventName}:typing:error`, {
            error: 'Typing animation failed',
            finalText: text
        });
    }
}

module.exports = {
    TypingAnimator,
    typeText,
    typeWords,
    emitTypingAnimation
};
