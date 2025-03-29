import {blobToBase64} from '@utils/utils';
import {Location} from '@types';

function getPrompt(lang: Location, ethnicity: string, age: number, sex: string, bio: string) {
  const promptSubjectBase = `${ethnicity} ${sex} individual, aged approximately ${age}.`;
  const promptRealismDetails = `Photorealistic, candid quality photo. Authentic natural features: realistic detailed skin texture (pores, slight imperfections, natural oils), lifelike eyes conveying emotion, natural unposed expression and posture. Use realistic, natural lighting suitable for the scene. Genuine human traits, personality, warmth, approachability, avoiding stereotypes. Integrate the following description naturally: ${bio}.`;

  const negativePromptStart =
    'unrealistic, fake, illustration, painting, drawing, 3D render, cartoon, anime, sketch, doll-like, plastic skin, smooth skin, airbrushed, polished skin, exaggerated features, deformed, disfigured, extra limbs, bad anatomy, unrealistic body proportions, vacant stare, dead eyes, bad lighting, studio lighting (unless specified), blurry, low quality, noisy, watermark, signature, text, multiple people. ';

  const probabilities = Math.floor(Math.random() * 7) + 1;
  let sceneNegativePrompt = '';
  let scenePrompt = '';

  const cityCountry = `${lang?.city}, ${lang?.country}`;

  switch (probabilities) {
    case 1: // Bustling Street
      scenePrompt = `Medium wide shot capturing ${promptSubjectBase} walking down a bustling, vibrant street in ${cityCountry}, fully integrated into the environment. Detailed background: crowded sidewalks, diverse people, colorful street vendors, textured building facades (mix of old and new), street trees, cars. Subject is laughing or smiling warmly. Energetic atmosphere, natural sunlight, distinct shadows. Depth of field blurring distant background slightly. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'close-up, headshot, portrait shot, face shot, subject fills frame, isolated subject, empty streets, desolate cityscape, plain buildings, sterile environment, generic background, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 2: // Park Scene
      scenePrompt = `Medium shot featuring ${promptSubjectBase} sitting comfortably on a grassy patch in a detailed park in ${cityCountry}, clearly showing the surrounding park setting. Scene includes: lush green grass, diverse trees casting soft shadows, blooming flowerbeds, park benches, distant people. Subject smiling joyfully (perhaps with pet if bio fits) or soaking in the peaceful atmosphere. Warm, natural daylight. Relaxed posture. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up, subject fills frame, isolated subject, barren park, dead grass, artificial greenery, flat landscape, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 3: // Cozy Living Room
      scenePrompt = `Medium shot capturing the cozy atmosphere with ${promptSubjectBase} relaxing in a lived-in living room in ${cityCountry}. Scene details: soft ambient light, plush sofa (textured cushions/throws), wooden coffee table (realistic clutter: books, mug, plant), wall decor (photos/art). Window showing outside glimpse adds depth. Subject leaning back, content expression (e.g., sipping drink). Warm, inviting feel. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'extreme close-up, subject fills frame, isolated subject, empty room, sterile interior, minimalist design (unless specified), no personal items, harsh lighting, unrealistic furniture, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 4: // Bedroom Scene
      scenePrompt = `Medium close-up focusing on the mood of ${promptSubjectBase} lying comfortably on a bed in a relatable bedroom in ${cityCountry}, showing personal space context. Setting: simple but personalized (soft textured bedding, bedside table with lamp/book, wall posters/photos). Soft natural light from window (hint of outside). Subject looking at phone/listening to music (headphones visible?), with a contemplative, bored, or relaxed expression. Intimate, quiet mood. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'wide shot, full body shot, subject far away, empty sterile bedroom, perfectly tidy, no personal objects, harsh lighting, unrealistic bed, generic hotel room look, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 5: // Beach Selfie
      scenePrompt = `Selfie style medium shot by ${promptSubjectBase} on a sunny, sandy beach in ${cityCountry}, ensuring the vibrant beach background is clearly visible and detailed. Subject has a bright, joyful smile, playful posture. Background: realistic golden sand, blue ocean (gentle waves), distant palm trees/beachgoers for life. Clear sky, soft clouds. Bright natural sunlight. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'subject blocking entire background, blurry background, out of focus background, empty desolate beach, flat gray sand, motionless water, overcast sky, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 6: // Modern Cafe
      scenePrompt = `Medium shot showing ${promptSubjectBase} integrated into the environment of a bustling but cozy modern cafe in ${cityCountry}, working and looking at their laptop. Details: wooden tables (slight wear), comfortable chairs, warm ambient lighting (lamps/windows), shelves (books/plants), background glimpse of barista/other customers (blurred). Subject focused on screen, content/thoughtful. Capture cafe atmosphere and subject's concentration. Depth of field keeping subject sharp, background softly blurred. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'close-up, headshot, face shot, subject fills frame, isolated subject, empty sterile cafe, generic furniture, no decor, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;

    case 7: // Night Concert
      scenePrompt = `Medium shot from within the crowd capturing the electric atmosphere with ${promptSubjectBase} immersed in a vibrant night concert in ${cityCountry}. Scene: colorful stage lights, stage/performers visible (can be slightly blurred/silhouetted), surrounding crowd members (cheering/recording). Subject's face shows excitement/awe/joy (singing along/looking at stage). Dynamic low-light photography style, possible light flares. ${promptRealismDetails}`;
      sceneNegativePrompt =
        'close-up, headshot, face shot, subject fills frame, isolated subject, empty concert venue, no stage lights, no crowd, brightly lit room, daytime concert, flat lighting, static atmosphere, studio backdrop, plain background, solid color background, gradient background, no background details.';
      break;
  }

  const finalPrompt = scenePrompt;
  const finalNegativePrompt = `${negativePromptStart} ${sceneNegativePrompt}`;

  return {negativePrompt: finalNegativePrompt, prompt: finalPrompt};
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
