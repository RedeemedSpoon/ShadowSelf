import {blobToBase64} from '@utils/utils';
import {Location} from '@types';

function getPrompt(lang: Location, ethnicity: string, age: number, sex: string, bio: string) {
  const promptStart = `${ethnicity} ${sex} individual, aged ${age}, showcasing authentic and natural features, with realistic skin texture, facial expression, and posture with realistic lighting. The person should reflect genuine human traits, with subtle imperfections and a non-stereotypical appearance, exuding a sense of warmth, personality, and approachability, with the following description: ${bio}.`;

  const negativePromptStart =
    'hyper-realistic, polished skin, exaggerated features, overly symmetrical, robotic or artificial facial expressions, cartoonish, stylized, unrealistic traits, bad lighting';

  const probabilities = Math.ceil(Math.random() * 9);
  let negativePrompt = '';
  let prompt = '';

  switch (probabilities) {
    case 1:
      prompt = `They are walking down a bustling street in ${lang?.city}, ${lang?.country}. The scene features crowded sidewalks with people walking by, street vendors with colorful displays, trees lining the avenue, and a mix of modern and traditional architecture in the background. The person is laughing or smiling warmly at someone, exuding a sense of joy and friendliness. Their posture is relaxed yet confident, engaging with the world around them in a lively, cheerful manner. The sunlight creates natural shadows, and the vibe is lively and energetic.`;
      negativePrompt =
        'empty streets, flat or minimalistic urban settings, plain buildings, lack of trees, street vendors, or people. No vibrant or detailed background, sterile, overly digital cityscapes.';
      break;

    case 2:
      prompt = `They are sitting on a grassy patch in a park in ${lang?.city}, ${lang?.country}, surrounded by lush greenery, tall trees with leaves gently swaying in the breeze, and colorful flowers in bloom. There are benches and picnic tables scattered around, with a few people enjoying the outdoors, walking their dogs, or reading books. The person is smiling joyfully at their pet, their face radiating happiness and affection. Their body language is open and warm, reflecting the peaceful and carefree nature of the moment.`;
      negativePrompt =
        'bare, empty parks with no trees, benches, or details. Flat, unrealistic greenery, no dynamic elements like people or animals, lifeless, uninspired park scenes.';
      break;

    case 3:
      prompt = `They are sitting in a cozy living room in ${lang?.city}, ${lang?.country}. The setting is warm, with soft lighting, a plush sofa covered in patterned cushions, and a wooden coffee table with personal items such as books, coffee mugs, and small plants. On the walls, there are family photos or artwork, adding a personal touch to the room. A soft rug lies beneath the coffee table, and a large window lets in natural light, with a view of the city skyline or a garden outside. The person is leaning back on the sofa, smiling contently as they sip from a coffee cup, radiating a sense of calm and peaceful enjoyment.`;
      negativePrompt =
        'empty or sterile interiors, no personal touches like books, plants, or decor. Lack of warmth or lighting, lifeless furniture, no detailed backgrounds like windows or views.';
      break;

    case 4:
      prompt = `They are lying on a bed in ${lang?.city}, ${lang?.country}, with their phone in hand and headphones on, looking contemplative or slightly bored. The bedroom is simple but inviting, with soft bedding, a bedside table with a lamp and books, and a small window showing a glimpse of the outside world. A few framed pictures or mementos are placed on the shelves, giving the room a personal, lived-in feel. The lighting is soft and cozy, creating a relaxed atmosphere. The person’s expression conveys a mix of introspection and a touch of longing, as they pause to reflect on something important.`;
      negativePrompt =
        'empty, lifeless bedroom scenes with no personal items, no soft lighting, no windows or meaningful background details. Flat, unrealistic or overly digital settings.';
      break;

    case 5:
      prompt = `They are on a sandy beach in ${lang?.city}, ${lang?.country}, taking a selfie with a bright smile. The beach is wide, with golden sand stretching out under the sun, and the blue ocean waves gently rolling onto the shore. There are palm trees swaying in the breeze, and a few people are enjoying the beach—some lounging under umbrellas, others playing in the sand or surfing in the distance. The sky is clear, with a few fluffy clouds scattered across. The person’s joyful and carefree expression captures the excitement and freedom of the moment, and their posture is playful, exuding a sense of adventure and happiness.`;
      negativePrompt =
        'empty beaches, no waves, trees, or beachgoers. Bland, colorless sand and ocean backgrounds, no life, no clear sky, or unrealistic beach environments.';
      break;

    case 6:
      prompt = `They are working in a modern cafe in ${lang?.city}, ${lang?.country}, with a laptop open in front of them, focused on their task. The cafe is cozy, with wooden tables, comfortable chairs, and warm ambient lighting. There are shelves with books and potted plants, and a chalkboard menu on the wall. The aroma of coffee fills the air, with a few customers quietly chatting or working on their own laptops. The person’s face is focused yet content, their eyes narrowed slightly in concentration, their posture slightly leaning toward the screen, fully absorbed in their work.`;
      negativePrompt =
        'sterile or overly digital cafe environments, no bookshelves, plants, or personal touches. Flat lighting, lifeless seating, no customers or detailed decor.';
      break;

    case 7:
      prompt = `They are at a night concert in ${lang?.city}, ${lang?.country}, surrounded by vibrant lights and a large crowd. The stage is bathed in colorful spotlights, with a visible band or performers, and the crowd is cheering, holding up their phones and waving their hands in excitement. The person’s face is alive with excitement, eyes wide in awe, mouth open in a joyous cheer. They are caught up in the energy of the crowd, their hands raised high, completely immersed in the electrifying atmosphere.`;
      negativePrompt =
        'empty, flat concert settings, no stage lights, no crowd, lack of excitement or color. No vibrant energy, sterile or digital backgrounds.';
      break;
  }

  return {negativePrompt: negativePromptStart + negativePrompt, prompt: promptStart + prompt};
}

export async function generateProfile(lang: Location, age: number, sex: string, ethnicity: string, bio: string): Promise<string> {
  const {prompt, negativePrompt} = getPrompt(lang, ethnicity, age, sex, bio);

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('aspect_ratio', '1:1');
  formData.append('output_format', 'png');
  formData.append('negative_prompt', negativePrompt);

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    body: formData,
    headers: {
      authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      accept: 'image/*',
    },
  });

  const blob = await response.blob();
  return await blobToBase64(blob);
}
