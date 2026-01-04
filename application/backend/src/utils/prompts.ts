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
    {
      shotType: 'Professional headshot',
      action: 'facing the camera squarely with a polite, confident smile and upright posture',
      environment:
        'a clean, neutral background, such as a plain textured wall or a heavily blurred office setting, completely free of distractions',
      lighting: 'soft, even, studio-quality lighting that highlights facial features without harsh shadows',
      mood: 'trustworthy, competent, and professional',
      cameraDetails: 'an 85mm portrait lens with a shallow depth of field',
      details: 'smart-casual or professional attire and neatly groomed appearance',
      negative: 'busy background, outdoor elements, messy hair, casual t-shirt',
    },
    {
      shotType: 'Car interior selfie',
      action: "sitting in the driver's seat of a parked car, looking slightly up at the camera with a casual expression",
      environment: 'the interior of a modern car with a seatbelt visible and a glimpse of the outside through the window',
      lighting: 'diffused natural daylight streaming in through the windshield (the "car selfie lighting" effect)',
      mood: 'spontaneous and everyday',
      cameraDetails: 'a high-quality front-facing smartphone camera',
      details: 'natural skin texture and the subtle details of the car upholstery',
      negative: 'driving, motion blur, dark night, traffic accident',
    },
    {
      shotType: 'Across-the-table portrait',
      action: 'leaning slightly forward with a drink (coffee or cocktail) on the table, smiling engagingly at the photographer',
      environment: `a stylish, dimly lit restaurant or bistro in ${lang.city} with ambient background details`,
      lighting: 'warm, intimate lighting from overhead fixtures or a candle',
      mood: 'social, elegant, and relaxed',
      cameraDetails: 'a 50mm lens with a wide aperture (f/1.8)',
      details: 'stylish evening attire and the bokeh of lights in the background',
      negative: 'bright daylight, office setting, messy table, food stains',
    },
    {
      shotType: 'Fitness mirror shot',
      action: 'standing in front of a large mirror, holding a phone, checking their form or outfit',
      environment: 'a clean, modern gym with equipment visible in the background',
      lighting: 'bright, cool-toned overhead fluorescent lighting',
      mood: 'motivated and active',
      cameraDetails: 'a smartphone camera reflection',
      details: 'athletic wear/sportswear and a confident posture',
      negative: 'dirty gym, crowded, dark, sweat stains, overly revealing',
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
  });

  for (const part of response.candidates![0]!.content!.parts!) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      return imageData!;
    }
  }

  return '';
}
