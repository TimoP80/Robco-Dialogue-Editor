import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Create a complete Fallout-style branching dialogue tree (2-3 nodes).
          Speaker: Vault Overseer. Scenario: Player asks for a water chip.
          CRITICAL INSTRUCTIONS:
          - Ensure choices form a branching conversation. 
          - npc_dialogue MUST link to player_responses.
          - player_responses MUST link to other npc_dialogues.
          - EVERY node (except the final closing ones) MUST have a populated 'linksTo' array pointing to existing customIds.
          - 'linksTo' MUST be an array of strings pointing to child 'customId's.
          - Use customIds like "1", "2", "3", etc.`,
        config: {
          systemInstruction: "You are an expert RPG...",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    customId: { type: Type.STRING },
                    speaker: { type: Type.STRING },
                    linksTo: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["type", "text", "customId"]
                }
              }
            },
            required: ["items"]
          }
        }
    });
    console.log("RESPONSE:", response.text);
}
run();
