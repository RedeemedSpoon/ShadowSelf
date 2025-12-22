import {GoogleGenAI} from '@google/genai';
import {Location} from '@types';

function getPrompt(lang: Location, ethnicity: string, age: number, sex: string, bio: string): string {
  const subject = `${ethnicity} ${sex}, aged approximately ${age}. Bio for context: "${bio}" (Use the bio to influence the person's style, expression, and surroundings, but do not write this text on the image.)`;

  const baseNegativePrompt =
    'Unrealistic, 3D, render, cartoon, anime, painting, disfigured, bad anatomy, plastic, fake, doll, video game, signature, watermark, text, grainy, low-resolution, blurry.';

  const scenes = [
    {
      shotType: 'Medium close-up candid shot',
      action: 'walking confidently and smiling warmly at the camera',
      environment: `a vibrant, bustling street in ${lang.city}, ${lang.country}, with blurred pedestrians and colorful storefronts in the background`,
      lighting: 'bright, natural afternoon sunlight',
      mood: 'energetic and joyful',
      cameraDetails: 'a DSLR with a prime lens',
      details: 'authentic street fashion and natural facial expressions',
      negative: 'empty street, studio background',
    },
    {
      shotType: 'Medium shot',
      action: 'sitting on a park bench, looking relaxed and happy',
      environment: `a lush, green park in ${lang.city} with dappled sunlight filtering through trees`,
      lighting: 'warm, golden hour light',
      mood: 'peaceful and serene',
      cameraDetails: 'a high-resolution mirrorless camera',
      details: 'the texture of their clothing and soft, natural skin tones',
      negative: 'barren park, dead grass, harsh shadows',
    },
    {
      shotType: 'Medium close-up',
      action: 'relaxing on a comfortable sofa, holding a mug, with a gentle smile',
      environment: 'a cozy, lived-in living room with soft textiles and personal decor',
      lighting: 'soft, ambient light from a nearby window',
      mood: 'intimate and calm',
      cameraDetails: 'a 50mm lens to create a slight background blur',
      details: 'the soft textures of the room and a genuine, thoughtful expression',
      negative: 'empty sterile room, harsh lighting',
    },
    {
      shotType: 'Candid medium shot',
      action: 'sitting on their bed, dressed casually, perhaps listening to music with headphones',
      environment: 'a relatable and personalized bedroom with posters and books visible',
      lighting: 'natural morning light from a window',
      mood: 'relaxed and contemplative',
      cameraDetails: 'a smartphone camera with portrait mode',
      details: 'a natural, unposed posture and the soft texture of the bedding',
      negative: 'perfectly tidy showroom, hotel room, provocative',
    },
    {
      shotType: 'Selfie-style close-up',
      action: 'smiling brightly into the camera, capturing a fun moment',
      environment: `a sunny, sandy beach in ${lang.city}, with soft waves in the background`,
      lighting: 'bright, direct sunlight with a clear blue sky',
      mood: 'carefree and happy',
      cameraDetails: 'a modern smartphone front-facing camera',
      details: 'wind-swept hair, genuine laughter, and droplets of sea spray',
      negative: 'empty desolate beach, overcast sky, third-person view',
    },
    {
      shotType: 'Medium shot',
      action: 'sitting at a small table, looking up from a laptop or book with an engaging glance',
      environment: `a modern, cozy cafe in ${lang.city} with warm interior lighting and blurred patrons`,
      lighting: 'a mix of warm indoor lamps and cool daylight from a window',
      mood: 'studious yet approachable',
      cameraDetails: 'a 35mm lens, capturing crisp details',
      details: 'the rich texture of the wooden table and the warm glow on their face',
      negative: 'empty sterile cafe, generic furniture',
    },
    {
      shotType: 'Dynamic medium close-up',
      action: 'laughing and looking towards the camera, immersed in the moment',
      environment: 'a vibrant night concert or music festival, with blurred stage lights in the background',
      lighting: 'dynamic and colorful stage lighting casting a glow on their face',
      mood: 'ecstatic and energetic',
      cameraDetails: 'a low-light capable camera, capturing motion and energy',
      details: 'authentic expressions of joy and colorful light flares',
      negative: 'empty venue, daytime, brightly lit room',
    },
    {
      shotType: 'Casual mirror selfie',
      action: 'taking a photo with their phone (visible in reflection), with a confident or playful pose',
      environment: 'a clean, well-lit, and modern bathroom',
      lighting: 'soft, flattering light from a vanity mirror',
      mood: 'casual and confident',
      cameraDetails: 'a smartphone camera reflection',
      details: 'the clear reflection in the mirror and a natural, everyday expression',
      negative: 'dirty bathroom, cluttered, dark, distorted reflection, provocative pose',
    },
  ];

  const chosenScene = scenes[Math.floor(Math.random() * scenes.length)];

  const fullPrompt = `A photorealistic ${chosenScene.shotType} of ${subject}, ${chosenScene.action}, set in ${chosenScene.environment}. The scene is illuminated by ${chosenScene.lighting}, creating a ${chosenScene.mood} atmosphere. Captured with ${chosenScene.cameraDetails}, emphasizing ${chosenScene.details}. The image should be in a 1:1 aspect ratio, styled like a popular social media profile picture.

Negative Prompt: ${baseNegativePrompt}, ${chosenScene.negative}`;

  return fullPrompt;
}
export async function generateProfile(lang: Location, age: number, sex: string, ethnicity: string, bio: string): Promise<string> {
  const prompt = getPrompt(lang, ethnicity, age, sex, bio);
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({apiKey});

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: prompt,
    config: {temperature: 0.9},
  });

  for (const part of response.candidates![0]!.content!.parts!) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      return imageData!;
    }
  }

  return '';
}
