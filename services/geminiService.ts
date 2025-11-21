import { GoogleGenAI, Type } from "@google/genai";
import { GeminiModel, TarotCardData } from "../types";

// Helper to validate API Key availability
const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("La clé API n'est pas configurée. Veuillez vérifier votre environnement.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Draws a random tarot card with text interpretation using Gemini Flash.
 */
export const drawTarotReading = async (): Promise<TarotCardData> => {
  const ai = getClient();
  
  const prompt = `
    Agis comme un mystique expert en Tarot.
    Tire une carte de Tarot aléatoire (Majeure ou Mineure) pour l'utilisateur.
    Génère une réponse structurée en JSON contenant :
    1. Le nom de la carte (en Français).
    2. Une description visuelle courte mais évocatrice de la carte (pour générer une image ensuite).
    3. La signification générale.
    4. Un message spirituel personnel et profond pour l'utilisateur aujourd'hui.
  `;

  const response = await ai.models.generateContent({
    model: GeminiModel.TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          visualDescription: { type: Type.STRING },
          meaning: { type: Type.STRING },
          spiritualMessage: { type: Type.STRING }
        },
        required: ["name", "visualDescription", "meaning", "spiritualMessage"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Réponse vide de l'oracle.");
  
  return JSON.parse(text) as TarotCardData;
};

/**
 * Generates an initial image for the drawn card using Gemini Flash Image.
 */
export const generateCardImage = async (visualDescription: string, cardName: string): Promise<string> => {
  const ai = getClient();
  
  const prompt = `Une carte de tarot artistique et mystique représentant: ${cardName}. ${visualDescription}. Style détaillé, spirituel, onirique, haute résolution, format carte de tarot.`;

  const response = await ai.models.generateContent({
    model: GeminiModel.IMAGE,
    contents: prompt,
    config: {
      // Note: Flash Image does not support aspect ratio config in the same way as Imagen, 
      // but we prompt for it. 
      // Since we can't rely on aspect ratio param for flash-image in all SDK versions yet, 
      // we rely on the model's understanding of "Tarot Card".
    }
  });

  // Iterate through parts to find the image
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Impossible de générer l'image de la carte.");
};

/**
 * Edits the existing card image based on user prompt using Gemini Flash Image.
 * This fulfills the "Nano banana" requirement.
 */
export const editCardImage = async (currentBase64Image: string, userPrompt: string): Promise<string> => {
  const ai = getClient();

  // Extract pure base64 if it has prefix
  const base64Data = currentBase64Image.split(',')[1] || currentBase64Image;
  const mimeType = currentBase64Image.split(';')[0].split(':')[1] || 'image/png';

  const prompt = `Modifie cette image de carte de tarot selon l'instruction suivante : "${userPrompt}". Garde la composition générale d'une carte de tarot mais applique le changement de style ou de contenu demandé.`;

  const response = await ai.models.generateContent({
    model: GeminiModel.IMAGE,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Impossible de modifier l'image.");
};
