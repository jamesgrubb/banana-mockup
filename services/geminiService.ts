import { GoogleGenAI, Modality } from "@google/genai";
import { ImageType, MockupStyle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateMockup = async (
  base64ImageData: string,
  mimeType: string,
  imageType: ImageType,
  style: MockupStyle
): Promise<string> => {
  try {
    const prompt = `Task: Create a photorealistic mockup.
Input: The user has provided an image of a ${imageType}.
Style: Generate the mockup in a ${style} aesthetic.

CRITICAL INSTRUCTIONS:
1.  **Color Accuracy**: This is the most important rule. The colors of the user's original design must be preserved with 100% accuracy. Do NOT apply any color grading, filters, or tints from the background lighting to the user's design. The colors in the mockup must be an exact match to the colors in the provided image.
2.  **Fidelity**: The original design, including all text, logos, and graphics, must be rendered perfectly without any distortion, alteration, or change in aspect ratio.
3.  **Realism**: The mockup must look like a real photograph. The background, lighting, and shadows should be realistic and complement the requested style, but they must NOT affect the colors of the user's design itself.
4.  **Composition**: Place the ${imageType} at a natural, slightly angled view on a clean, uncluttered background.`;


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];

    // Happy path: image is generated and present
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }

    // Unhappy path: something went wrong, let's find out what.
    console.error("Invalid response from Gemini API:", JSON.stringify(response, null, 2));

    // Check for prompt-level blocking first
    const blockReason = response.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Request blocked by the API's safety filter (Reason: ${blockReason}). This can be triggered by certain content, such as realistic depictions of people. Please try a different image.`);
    }

    // Check for candidate-level finish reason for more specific errors
    const finishReason = candidate?.finishReason;
    if (finishReason) {
        // Cast to string to handle potential new/untyped reasons from the API
        switch (finishReason as string) {
            case 'SAFETY':
                throw new Error("Image generation was blocked for safety reasons. This can be triggered by certain content, such as realistic depictions of people. Please try a different image.");
            case 'IMAGE_OTHER':
            case 'OTHER':
                throw new Error("The AI couldn't create a mockup for this combination. Please try a different style or a different image.");
            default:
                throw new Error(`Image generation failed with an unexpected reason: ${finishReason}.`);
        }
    }

    // Fallback error if no other reason is found
    throw new Error("No image data found in API response. The AI may have failed to generate an image.");

  } catch (error) {
    console.error("Error generating mockup:", error);
    // Rethrow the error to be handled by the UI, preserving the specific message.
    throw error;
  }
};


export const removePersonFromImage = async (
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
  try {
    const prompt = "You are an expert photo editor. Your task is to completely remove any and all people from the user-provided image. Intelligently fill in the background where the people were, ensuring the result looks natural and seamless. Preserve all other elements of the image, such as text, logos, and background graphics, with perfect fidelity. Do not alter the aspect ratio or overall composition.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: { data: base64ImageData, mimeType: mimeType },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }

    console.error("Invalid response from Gemini API during image repair:", JSON.stringify(response, null, 2));
    
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("The AI's safety filter also blocked the attempt to edit the image. Please try a different original image.");
    }

    throw new Error("The AI failed to edit the image. Please try again.");

  } catch (error) {
    console.error("Error removing person from image:", error);
    if (error instanceof Error) {
        throw error; // Rethrow with specific message
    }
    throw new Error("An unknown error occurred while trying to repair the image.");
  }
};